"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, createOrder, updateOrder, deleteOrder, OrderWithDetails } from '@/services/orderService';
import { getCustomers } from '@/services/customerService';
import { getProducts } from '@/services/productService';
import { Tables, Enums } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const orderStatuses: Enums<'order_status'>[] = ['Pending', 'Under Production', 'Ready for Dispatch', 'Completed'];

const Orders: React.FC = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [statusFilter, setStatusFilter] = useState<Enums<'order_status'> | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);

  // New Order State
  const [newOrderCustomerId, setNewOrderCustomerId] = useState('');
  const [newOrderDueDate, setNewOrderDueDate] = useState<Date | undefined>(undefined);
  const [newOrderItems, setNewOrderItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [selectedProductForNewItem, setSelectedProductForNewItem] = useState('');
  const [quantityForNewItem, setQuantityForNewItem] = useState(1);

  // Edit Order State
  const [editOrderDueDate, setEditOrderDueDate] = useState<Date | undefined>(undefined);
  const [editOrderStatus, setEditOrderStatus] = useState<Enums<'order_status'>>('Pending');
  const [editOrderItems, setEditOrderItems] = useState<{ id?: string; productId: string; quantity: number; unitPrice: number; products?: Tables<'products'> }[]>([]);
  const [selectedProductForEditItem, setSelectedProductForEditItem] = useState('');
  const [quantityForEditItem, setQuantityForEditItem] = useState(1);

  const { data: orders, isLoading: isLoadingOrders, error: ordersError } = useQuery({
    queryKey: ['orders', statusFilter, searchTerm],
    queryFn: () => getOrders(statusFilter, searchTerm),
  });

  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers(),
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  const createOrderMutation = useMutation({
    mutationFn: ({ order, items }: { order: Omit<TablesInsert<'orders'>, 'user_id'> & { user_id: string }, items: TablesInsert<'order_items'>[] }) =>
      createOrder(order, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created successfully!');
      setIsCreateDialogOpen(false);
      setNewOrderCustomerId('');
      setNewOrderDueDate(undefined);
      setNewOrderItems([]);
      setSelectedProductForNewItem('');
      setQuantityForNewItem(1);
    },
    onError: (err) => {
      toast.error(`Failed to create order: ${err.message}`);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, updatedOrder }: { id: string; updatedOrder: Partial<Tables<'orders'>> }) =>
      updateOrder(id, updatedOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (err) => {
      toast.error(`Failed to update order: ${err.message}`);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to delete order: ${err.message}`);
    },
  });

  const handleCreateOrder = () => {
    if (!newOrderCustomerId) {
      toast.error('Please select a customer.');
      return;
    }
    if (newOrderItems.length === 0) {
      toast.error('Please add at least one product to the order.');
      return;
    }
    if (!session?.user?.id) {
      toast.error("User must be logged in to create an order.");
      return;
    }

    const totalAmount = newOrderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    createOrderMutation.mutate({
      order: {
        customer_id: newOrderCustomerId,
        due_date: newOrderDueDate ? format(newOrderDueDate, 'yyyy-MM-dd') : null,
        status: 'Pending',
        total_amount: totalAmount,
        user_id: session.user.id,
      },
      items: newOrderItems.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    });
  };

  const handleAddOrderItem = () => {
    if (!selectedProductForNewItem || quantityForNewItem <= 0) {
      toast.error('Please select a product and enter a valid quantity.');
      return;
    }
    const product = products?.find(p => p.id === selectedProductForNewItem);
    if (!product) return;

    setNewOrderItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.productId === selectedProductForNewItem);
      if (existingItemIndex > -1) {
        const updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity += quantityForNewItem;
        return updatedItems;
      }
      return [...prev, { productId: selectedProductForNewItem, quantity: quantityForNewItem, unitPrice: product.price }];
    });
    setSelectedProductForNewItem('');
    setQuantityForNewItem(1);
  };

  const handleRemoveOrderItem = (productId: string) => {
    setNewOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleEditClick = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setEditOrderDueDate(order.due_date ? new Date(order.due_date) : undefined);
    setEditOrderStatus(order.status);
    setEditOrderItems(order.order_items.map(item => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      products: item.products, // Keep product details for display
    })));
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedOrder) return;

    const totalAmount = editOrderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    updateOrderMutation.mutate({
      id: selectedOrder.id,
      updatedOrder: {
        due_date: editOrderDueDate ? format(editOrderDueDate, 'yyyy-MM-dd') : null,
        status: editOrderStatus,
        total_amount: totalAmount,
      },
    });
    // TODO: Implement update/delete/add for order items within an order
    // This would require more complex logic and potentially separate mutations
    toast.info("Order items editing is not yet fully implemented. Only order status and due date are updated.");
  };

  const handleAddEditOrderItem = () => {
    if (!selectedProductForEditItem || quantityForEditItem <= 0) {
      toast.error('Please select a product and enter a valid quantity.');
      return;
    }
    const product = products?.find(p => p.id === selectedProductForEditItem);
    if (!product) return;

    setEditOrderItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.productId === selectedProductForEditItem);
      if (existingItemIndex > -1) {
        const updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity += quantityForEditItem;
        return updatedItems;
      }
      return [...prev, { productId: selectedProductForEditItem, quantity: quantityForEditItem, unitPrice: product.price, products: product }];
    });
    setSelectedProductForEditItem('');
    setQuantityForEditItem(1);
  };

  const handleRemoveEditOrderItem = (productId: string) => {
    setEditOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  if (isLoadingOrders || isLoadingCustomers || isLoadingProducts) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-gray-600 dark:text-gray-400">Loading orders...</p>
    </div>
  );
  if (ordersError) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-red-600">Error loading orders: {ordersError.message}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl space-y-8">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Order Dashboard</CardTitle>
              <CardDescription>View and manage all customer orders.</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Order
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Input
                placeholder="Search orders by customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select
                value={statusFilter}
                onValueChange={(value: Enums<'order_status'>) => setStatusFilter(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {orderStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {orders && orders.length > 0 ? (
              <ul className="space-y-4">
                {orders.map((order) => (
                  <li key={order.id} className="p-4 border rounded-md bg-white dark:bg-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Order #{order.id.substring(0, 8)}</h3>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditClick(order)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => deleteOrderMutation.mutate(order.id)} disabled={deleteOrderMutation.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">Customer: {order.customers?.name || 'N/A'}</p>
                    <p className="text-gray-700 dark:text-gray-300">Status: <span className={`font-medium ${order.status === 'Completed' ? 'text-green-600' : order.status === 'Pending' ? 'text-yellow-600' : 'text-blue-600'}`}>{order.status}</span></p>
                    <p className="text-gray-700 dark:text-gray-300">Due Date: {order.due_date ? format(new Date(order.due_date), 'PPP') : 'N/A'}</p>
                    <p className="text-gray-700 dark:text-gray-300">Total: ${order.total_amount.toFixed(2)}</p>
                    <div className="mt-2">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">Items:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                        {order.order_items.map(item => (
                          <li key={item.id}>
                            {item.products?.name || 'Unknown Product'} (x{item.quantity}) @ ${item.unit_price.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Order Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>Fill in the details to create a new customer order.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="text-right">Customer</Label>
              <Select value={newOrderCustomerId} onValueChange={setNewOrderCustomerId}>
                <SelectTrigger id="customer" className="col-span-3">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due-date" className="text-right">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal col-span-3",
                      !newOrderDueDate && "text-muted-foreground"
                    )}
                  >
                    {newOrderDueDate ? format(newOrderDueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newOrderDueDate}
                    onSelect={setNewOrderDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="products" className="text-right">Products</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Select value={selectedProductForNewItem} onValueChange={setSelectedProductForNewItem}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(product => (
                        <SelectItem key={product.id} value={product.id}>{product.name} (${product.price.toFixed(2)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={quantityForNewItem}
                    onChange={(e) => setQuantityForNewItem(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <Button onClick={handleAddOrderItem} size="icon">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="space-y-1">
                  {newOrderItems.map(item => {
                    const product = products?.find(p => p.id === item.productId);
                    return (
                      <li key={item.productId} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-md">
                        <span>{product?.name || 'Unknown Product'} x {item.quantity}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveOrderItem(item.productId)}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrder} disabled={createOrderMutation.isPending}>
              {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      {selectedOrder && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Order #{selectedOrder.id.substring(0, 8)}</DialogTitle>
              <DialogDescription>Update order details and status.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-customer" className="text-right">Customer</Label>
                <Input id="edit-customer" value={selectedOrder.customers?.name || 'N/A'} readOnly className="col-span-3" />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-due-date" className="text-right">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal col-span-3",
                        !editOrderDueDate && "text-muted-foreground"
                      )}
                    >
                      {editOrderDueDate ? format(editOrderDueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editOrderDueDate}
                      onSelect={setEditOrderDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">Status</Label>
                <Select value={editOrderStatus} onValueChange={(value: Enums<'order_status'>) => setEditOrderStatus(value)}>
                  <SelectTrigger id="edit-status" className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-products" className="text-right">Products</Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex gap-2">
                    <Select value={selectedProductForEditItem} onValueChange={setSelectedProductForEditItem}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(product => (
                          <SelectItem key={product.id} value={product.id}>{product.name} (${product.price.toFixed(2)})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={quantityForEditItem}
                      onChange={(e) => setQuantityForEditItem(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Button onClick={handleAddEditOrderItem} size="icon">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <ul className="space-y-1">
                    {editOrderItems.map(item => {
                      const product = products?.find(p => p.id === item.productId);
                      return (
                        <li key={item.id || item.productId} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-md">
                          <span>{product?.name || 'Unknown Product'} x {item.quantity}</span>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveEditOrderItem(item.productId)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={updateOrderMutation.isPending}>
                {updateOrderMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default Orders;
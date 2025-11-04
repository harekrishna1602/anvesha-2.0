"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, createOrder, updateOrder, deleteOrder, OrderWithDetails } from '@/services/orderService';
import { getCustomers } from '@/services/customerService';
import { getProducts } from '@/services/productService';
import { Enums, TablesInsert } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

// Modular components for Orders page
import OrderDashboardControls from '@/components/orders/OrderDashboardControls';
import OrderList from '@/components/orders/OrderList';
import CreateOrderDialog from '@/components/orders/CreateOrderDialog';
import EditOrderDialog from '@/components/orders/EditOrderDialog';

const orderStatuses: Enums<'order_status'>[] = ['Pending', 'Under Production', 'Ready for Dispatch', 'Completed'];

const Orders: React.FC = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [statusFilter, setStatusFilter] = useState<Enums<'order_status'> | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);

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
    },
    onError: (err) => {
      toast.error(`Failed to create order: ${err.message}`);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, updatedOrder }: { id: string; updatedOrder: Partial<TablesInsert<'orders'>> }) =>
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

  const handleCreateOrder = (order: Omit<TablesInsert<'orders'>, 'user_id'> & { user_id: string }, items: TablesInsert<'order_items'>[]) => {
    createOrderMutation.mutate({ order, items });
  };

  const handleUpdateOrder = (id: string, updatedOrder: Partial<TablesInsert<'orders'>>) => {
    updateOrderMutation.mutate({ id, updatedOrder });
  };

  const handleDeleteOrder = (orderId: string) => {
    deleteOrderMutation.mutate(orderId);
  };

  const handleEditClick = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsEditDialogOpen(true);
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
          <CardHeader>
            <CardTitle className="text-2xl">Order Dashboard</CardTitle>
            <CardDescription>View and manage all customer orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderDashboardControls
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onOpenCreateDialog={() => setIsCreateDialogOpen(true)}
              orderStatuses={orderStatuses}
            />

            {orders && orders.length > 0 ? (
              <OrderList
                orders={orders}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteOrder}
                isDeleting={deleteOrderMutation.isPending}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateOrderDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        customers={customers}
        products={products}
        onCreateOrder={handleCreateOrder}
        isCreating={createOrderMutation.isPending}
        userId={session?.user?.id}
      />

      {selectedOrder && (
        <EditOrderDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          order={selectedOrder}
          customers={customers}
          products={products}
          onUpdateOrder={handleUpdateOrder}
          isUpdating={updateOrderMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
};

export default Orders;
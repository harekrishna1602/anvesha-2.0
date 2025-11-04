"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tables, Enums, TablesInsert } from '@/types/supabase';
import { OrderWithDetails } from '@/services/orderService';
import OrderItemForm from './OrderItemForm';
import OrderItemListDisplay from './OrderItemListDisplay';
import { toast } from 'sonner';

interface EditOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithDetails | null;
  customers: Tables<'customers'>[] | undefined; // Not directly used for editing customer, but good for context
  products: Tables<'products'>[] | undefined;
  onUpdateOrder: (id: string, updatedOrder: Partial<Tables<'orders'>>) => void;
  isUpdating: boolean;
}

const orderStatuses: Enums<'order_status'>[] = ['Pending', 'Under Production', 'Ready for Dispatch', 'Completed'];

const EditOrderDialog: React.FC<EditOrderDialogProps> = ({
  isOpen,
  onClose,
  order,
  products,
  onUpdateOrder,
  isUpdating,
}) => {
  const [editOrderDueDate, setEditOrderDueDate] = useState<Date | undefined>(undefined);
  const [editOrderStatus, setEditOrderStatus] = useState<Enums<'order_status'>>('Pending');
  const [editOrderItems, setEditOrderItems] = useState<{ id?: string; productId: string; quantity: number; unitPrice: number; products?: Tables<'products'> }[]>([]);
  const [selectedProductForEditItem, setSelectedProductForEditItem] = useState('');
  const [quantityForEditItem, setQuantityForEditItem] = useState(1);

  useEffect(() => {
    if (order && isOpen) {
      setEditOrderDueDate(order.due_date ? new Date(order.due_date) : undefined);
      setEditOrderStatus(order.status);
      setEditOrderItems(order.order_items.map(item => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        products: item.products,
      })));
    }
  }, [order, isOpen]);

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

  const handleSubmit = () => {
    if (!order) return;

    const totalAmount = editOrderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    onUpdateOrder(order.id, {
      due_date: editOrderDueDate ? format(editOrderDueDate, 'yyyy-MM-dd') : null,
      status: editOrderStatus,
      total_amount: totalAmount,
    });
    // TODO: Implement update/delete/add for order items within an order
    // This would require more complex logic and potentially separate mutations
    toast.info("Order items editing is not yet fully implemented. Only order status and due date are updated.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Order #{order?.id.substring(0, 8)}</DialogTitle>
          <DialogDescription>Update order details and status.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-customer" className="text-right">Customer</Label>
            <Input id="edit-customer" value={order?.customers?.name || 'N/A'} readOnly className="col-span-3" />
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
              <OrderItemForm
                products={products}
                selectedProduct={selectedProductForEditItem}
                setSelectedProduct={setSelectedProductForEditItem}
                quantity={quantityForEditItem}
                setQuantity={setQuantityForEditItem}
                onAddItem={handleAddEditOrderItem}
              />
              <OrderItemListDisplay
                items={editOrderItems}
                allProducts={products}
                onRemoveItem={handleRemoveEditOrderItem}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderDialog;
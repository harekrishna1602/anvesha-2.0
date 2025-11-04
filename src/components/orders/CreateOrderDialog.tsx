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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tables, TablesInsert } from '@/types/supabase';
import OrderItemForm from './OrderItemForm';
import OrderItemListDisplay from './OrderItemListDisplay';
import { toast } from 'sonner';

interface CreateOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Tables<'customers'>[] | undefined;
  products: Tables<'products'>[] | undefined;
  onCreateOrder: (order: Omit<TablesInsert<'orders'>, 'user_id'> & { user_id: string }, items: TablesInsert<'order_items'>[]) => void;
  isCreating: boolean;
  userId: string | undefined;
}

const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({
  isOpen,
  onClose,
  customers,
  products,
  onCreateOrder,
  isCreating,
  userId,
}) => {
  const [newOrderCustomerId, setNewOrderCustomerId] = useState('');
  const [newOrderDueDate, setNewOrderDueDate] = useState<Date | undefined>(undefined);
  const [newOrderItems, setNewOrderItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [selectedProductForNewItem, setSelectedProductForNewItem] = useState('');
  const [quantityForNewItem, setQuantityForNewItem] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when dialog closes
      setNewOrderCustomerId('');
      setNewOrderDueDate(undefined);
      setNewOrderItems([]);
      setSelectedProductForNewItem('');
      setQuantityForNewItem(1);
    }
  }, [isOpen]);

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

  const handleSubmit = () => {
    if (!newOrderCustomerId) {
      toast.error('Please select a customer.');
      return;
    }
    if (newOrderItems.length === 0) {
      toast.error('Please add at least one product to the order.');
      return;
    }
    if (!userId) {
      toast.error("User must be logged in to create an order.");
      return;
    }

    const totalAmount = newOrderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    onCreateOrder(
      {
        customer_id: newOrderCustomerId,
        due_date: newOrderDueDate ? format(newOrderDueDate, 'yyyy-MM-dd') : null,
        status: 'Pending',
        total_amount: totalAmount,
        user_id: userId,
      },
      newOrderItems.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }))
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              <OrderItemForm
                products={products}
                selectedProduct={selectedProductForNewItem}
                setSelectedProduct={setSelectedProductForNewItem}
                quantity={quantityForNewItem}
                setQuantity={setQuantityForNewItem}
                onAddItem={handleAddOrderItem}
              />
              <OrderItemListDisplay
                items={newOrderItems}
                allProducts={products}
                onRemoveItem={handleRemoveOrderItem}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderDialog;
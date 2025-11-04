"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Tables } from '@/types/supabase';

interface OrderItemFormProps {
  products: Tables<'products'>[] | undefined;
  selectedProduct: string;
  setSelectedProduct: (productId: string) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  onAddItem: () => void;
}

const OrderItemForm: React.FC<OrderItemFormProps> = ({
  products,
  selectedProduct,
  setSelectedProduct,
  quantity,
  setQuantity,
  onAddItem,
}) => {
  return (
    <div className="flex gap-2">
      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
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
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        className="w-20"
      />
      <Button onClick={onAddItem} size="icon">
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default OrderItemForm;
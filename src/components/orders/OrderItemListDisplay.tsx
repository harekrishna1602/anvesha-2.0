"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Tables } from '@/types/supabase';

interface OrderItemListDisplayProps {
  items: { productId: string; quantity: number; products?: Tables<'products'> }[];
  allProducts: Tables<'products'>[] | undefined;
  onRemoveItem: (productId: string) => void;
}

const OrderItemListDisplay: React.FC<OrderItemListDisplayProps> = ({ items, allProducts, onRemoveItem }) => {
  return (
    <ul className="space-y-1">
      {items.map(item => {
        const product = allProducts?.find(p => p.id === item.productId) || item.products;
        return (
          <li key={item.productId} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-md">
            <span>{product?.name || 'Unknown Product'} x {item.quantity}</span>
            <Button variant="ghost" size="icon" onClick={() => onRemoveItem(item.productId)}>
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
};

export default OrderItemListDisplay;
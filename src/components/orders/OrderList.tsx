"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { OrderWithDetails } from '@/services/orderService';
import { format } from 'date-fns';

interface OrderListProps {
  orders: OrderWithDetails[];
  onEditClick: (order: OrderWithDetails) => void;
  onDeleteClick: (orderId: string) => void;
  isDeleting: boolean;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onEditClick, onDeleteClick, isDeleting }) => {
  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id} className="p-4 border rounded-md bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Order #{order.id.substring(0, 8)}</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={() => onEditClick(order)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => onDeleteClick(order.id)} disabled={isDeleting}>
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
  );
};

export default OrderList;
"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { OrderWithDetails } from '@/services/orderService';
import { format } from 'date-fns';

interface OrderListProps {
  orders: OrderWithDetails[];
  onEditClick: (order: OrderWithDetails) => void;
  onDeleteClick: (id: string) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onEditClick, onDeleteClick }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {orders.length === 0 ? (
        <p className="col-span-full text-center text-gray-500">No orders found.</p>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Order #{order.order_number}</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={() => onEditClick(order)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => onDeleteClick(order.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-xl">{order.customers?.name || 'N/A'}</CardTitle>
              <p className="text-sm text-gray-500">Status: {order.status}</p>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-600">Order Date: {order.order_date ? format(new Date(order.order_date), 'PPP') : 'N/A'}</p>
              <p className="text-sm text-gray-600">Due Date: {order.due_date ? format(new Date(order.due_date), 'PPP') : 'N/A'}</p>
              <p className="text-sm text-gray-600 mt-2">Total: ₹{order.total_amount?.toFixed(2)}</p>
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-1">Items:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {order.order_items?.map((item) => (
                    <li key={item.id}>
                      {item.products?.name} (x{item.quantity}) - ₹{item.unit_price?.toFixed(2)} each
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default OrderList;
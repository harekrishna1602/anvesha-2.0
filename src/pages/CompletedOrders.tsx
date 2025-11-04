"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrders, OrderWithDetails } from '@/services/orderService';
import { Enums } from '@/types/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import OrderList from '@/components/orders/OrderList';
import { toast } from 'sonner';

const CompletedOrders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const statusFilter: Enums<'order_status'> = 'Completed';

  const { data: orders, isLoading, error } = useQuery<OrderWithDetails[], Error>({
    queryKey: ['orders', statusFilter, searchTerm],
    queryFn: () => getOrders(statusFilter, searchTerm),
  });

  // For a completed orders page, we might not need edit/delete actions directly here,
  // but the OrderList component expects these props. We can pass no-op functions.
  const handleEditClick = (order: OrderWithDetails) => {
    toast.info(`Editing completed order #${order.order_number} is not available on this page.`);
  };

  const handleDeleteClick = (id: string) => {
    toast.info(`Deleting completed order #${id.substring(0, 8)} is not available on this page.`);
  };

  // For a completed orders page, selection might not be needed, but OrderList expects it.
  const selectedOrderIds: string[] = [];
  const handleSelectOrder = (id: string, isSelected: boolean) => {
    // No-op as selection is not intended for this page
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-gray-600 dark:text-gray-400">Loading completed orders...</p>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-red-600">Error loading completed orders: {error.message}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl space-y-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Completed Orders</CardTitle>
            <CardDescription>View all orders that have been marked as completed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search completed orders by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />

            {orders && orders.length > 0 ? (
              <OrderList
                orders={orders}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                selectedOrderIds={selectedOrderIds}
                onSelectOrder={handleSelectOrder}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No completed orders found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CompletedOrders;
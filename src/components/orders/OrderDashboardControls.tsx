"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Enums } from '@/types/supabase';

interface OrderDashboardControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: Enums<'order_status'> | undefined;
  setStatusFilter: (status: Enums<'order_status'> | undefined) => void;
  onOpenCreateDialog: () => void;
  orderStatuses: Enums<'order_status'>[];
}

const OrderDashboardControls: React.FC<OrderDashboardControlsProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onOpenCreateDialog,
  orderStatuses,
}) => {
  return (
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
      <Button onClick={onOpenCreateDialog}>
        <PlusCircle className="mr-2 h-4 w-4" /> Create New Order
      </Button>
    </div>
  );
};

export default OrderDashboardControls;
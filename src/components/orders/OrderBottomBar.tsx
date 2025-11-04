"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrder } from '@/services/orderService';
import { Enums } from '@/types/supabase';

interface OrderBottomBarProps {
  selectedOrderIds: string[];
  onClearSelection: () => void;
  onOrderUpdated: (orderId: string) => void;
}

const OrderBottomBar: React.FC<OrderBottomBarProps> = ({
  selectedOrderIds,
  onClearSelection,
  onOrderUpdated,
}) => {
  const queryClient = useQueryClient();

  const markAsCompleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return updateOrder(orderId, { status: 'Completed' as Enums<'order_status'> });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order #${data.order_number} marked as Completed!`);
      onOrderUpdated(data.id); // Notify parent to remove from selection
    },
    onError: (err) => {
      toast.error(`Failed to mark order as complete: ${err.message}`);
    },
  });

  const handleMarkSelectedAsComplete = () => {
    if (selectedOrderIds.length === 0) {
      toast.info("No orders selected.");
      return;
    }
    selectedOrderIds.forEach(orderId => {
      markAsCompleteMutation.mutate(orderId);
    });
  };

  if (selectedOrderIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 flex items-center justify-between z-50">
      <span className="text-sm font-medium">
        {selectedOrderIds.length} order{selectedOrderIds.length > 1 ? 's' : ''} selected
      </span>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={onClearSelection}
          disabled={markAsCompleteMutation.isPending}
        >
          <X className="mr-2 h-4 w-4" /> Clear Selection
        </Button>
        <Button
          onClick={handleMarkSelectedAsComplete}
          disabled={markAsCompleteMutation.isPending}
        >
          <Check className="mr-2 h-4 w-4" /> Mark as Complete
        </Button>
      </div>
    </div>
  );
};

export default OrderBottomBar;
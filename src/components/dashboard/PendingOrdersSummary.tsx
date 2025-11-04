"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPendingOrdersCount } from '@/services/orderService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const PendingOrdersSummary: React.FC = () => {
  const { data: pendingOrdersCount, isLoading, error } = useQuery({
    queryKey: ['pendingOrdersCount'],
    queryFn: getPendingOrdersCount,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  return (
    <Link to="/orders?status=Pending" className="block">
      <Card className="flex flex-col items-center justify-center text-center p-4 h-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
        <CardHeader className="p-0 pb-2">
          <Clock className="h-8 w-8 text-yellow-500 mb-2" />
          <CardTitle className="text-base font-semibold">Pending Orders</CardTitle>
          <CardDescription className="text-xs">Orders awaiting action</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-xl font-bold">...</p>
          ) : error ? (
            <p className="text-sm text-destructive">Error</p>
          ) : (
            <p className="text-xl font-bold">{pendingOrdersCount}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default PendingOrdersSummary;
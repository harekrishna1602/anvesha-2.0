"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReadyForDispatchOrdersCount } from '@/services/orderService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReadyForDispatchSummary: React.FC = () => {
  const { data: readyForDispatchCount, isLoading, error } = useQuery({
    queryKey: ['readyForDispatchCount'],
    queryFn: getReadyForDispatchOrdersCount,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  return (
    <Link to="/orders?status=Ready for Dispatch" className="block">
      <Card className="flex flex-col items-center justify-center text-center p-4 h-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
        <CardHeader className="p-0 pb-2">
          <Truck className="h-8 w-8 text-green-500 mb-2" />
          <CardTitle className="text-base font-semibold">Ready for Dispatch</CardTitle>
          <CardDescription className="text-xs">Orders awaiting shipment</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-xl font-bold">...</p>
          ) : error ? (
            <p className="text-sm text-destructive">Error</p>
          ) : (
            <p className="text-xl font-bold">{readyForDispatchCount}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default ReadyForDispatchSummary;
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRecentOrders } from '@/services/orderService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecentOrdersSummary: React.FC = () => {
  const { data: recentOrders, isLoading, error } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: () => getRecentOrders(3), // Fetch up to 3 recent orders
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  return (
    <Link to="/orders" className="block">
      <Card className="flex flex-col items-center justify-center text-center p-4 h-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
        <CardHeader className="p-0 pb-2">
          <History className="h-8 w-8 text-blue-500 mb-2" />
          <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
          <CardDescription className="text-xs">Latest customer orders</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-xl font-bold">...</p>
          ) : error ? (
            <p className="text-sm text-destructive">Error</p>
          ) : (
            <p className="text-xl font-bold">{recentOrders?.length || 0}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default RecentOrdersSummary;
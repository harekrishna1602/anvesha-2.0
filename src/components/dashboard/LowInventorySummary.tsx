"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLowStockMaterialCount } from '@/services/rawMaterialService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const LowInventorySummary: React.FC = () => {
  const { data: lowInventoryCount, isLoading, error } = useQuery({
    queryKey: ['lowInventoryCount'],
    queryFn: getLowStockMaterialCount,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  return (
    <Link to="/inventory" className="block">
      <Card className="flex flex-col items-center justify-center text-center p-4 h-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
        <CardHeader className="p-0 pb-2">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
          <CardTitle className="text-base font-semibold">Low Inventory</CardTitle>
          <CardDescription className="text-xs">Materials needing re-order</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-xl font-bold">...</p>
          ) : error ? (
            <p className="text-sm text-destructive">Error</p>
          ) : (
            <p className="text-xl font-bold">{lowInventoryCount}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default LowInventorySummary;
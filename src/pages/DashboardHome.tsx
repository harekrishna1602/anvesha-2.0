"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Package, ShoppingCart, Warehouse } from 'lucide-react';
import PendingOrdersSummary from '@/components/dashboard/PendingOrdersSummary';
import LowInventorySummary from '@/components/dashboard/LowInventorySummary';
import ReadyForDispatchSummary from '@/components/dashboard/ReadyForDispatchSummary'; // Import the new component

const DashboardHome: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="w-full max-w-6xl space-y-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">Welcome to Anvesha</h2>
        <p className="text-center text-lg text-gray-600 dark:text-gray-400">Select a module or view summaries.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Navigation Panels */}
          <Link to="/customers" className="block">
            <Card className="flex flex-col items-center justify-center text-center p-4 h-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              <CardHeader className="p-0 pb-2">
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base font-semibold">Customers</CardTitle>
                <CardDescription className="text-xs">Manage clients</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/products" className="block">
            <Card className="flex flex-col items-center justify-center text-center p-4 h-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              <CardHeader className="p-0 pb-2">
                <Package className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base font-semibold">Products</CardTitle>
                <CardDescription className="text-xs">Manage products</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/orders" className="block">
            <Card className="flex flex-col items-center justify-center text-center p-4 h-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              <CardHeader className="p-0 pb-2">
                <ShoppingCart className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base font-semibold">Orders</CardTitle>
                <CardDescription className="text-xs">Track orders</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/inventory" className="block">
            <Card className="flex flex-col items-center justify-center text-center p-4 h-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              <CardHeader className="p-0 pb-2">
                <Warehouse className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base font-semibold">Inventory</CardTitle>
                <CardDescription className="text-xs">Manage stock</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Summary Panels */}
          <PendingOrdersSummary />
          <LowInventorySummary />
          <ReadyForDispatchSummary /> {/* Replaced RecentOrdersSummary */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
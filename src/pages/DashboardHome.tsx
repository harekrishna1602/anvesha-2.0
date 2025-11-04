"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Package, ShoppingCart, Warehouse } from 'lucide-react';

const DashboardHome: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl space-y-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">Welcome to Your Dashboard</h2>
        <p className="text-center text-lg text-gray-600 dark:text-gray-400">Select a module to get started.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="flex flex-col items-center text-center p-6">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Customers</CardTitle>
              <CardDescription>Manage your client base.</CardDescription>
            </CardHeader>
            <Link to="/customers" className="mt-auto">
              <Button>Go to Customers</Button>
            </Link>
          </Card>

          <Card className="flex flex-col items-center text-center p-6">
            <CardHeader>
              <Package className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Products</CardTitle>
              <CardDescription>Define and manage your products.</CardDescription>
            </CardHeader>
            <Link to="/products" className="mt-auto">
              <Button>Go to Products</Button>
            </Link>
          </Card>

          <Card className="flex flex-col items-center text-center p-6">
            <CardHeader>
              <ShoppingCart className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Orders</CardTitle>
              <CardDescription>Process and track customer orders.</CardDescription>
            </CardHeader>
            <Link to="/orders" className="mt-auto">
              <Button>Go to Orders</Button>
            </Link>
          </Card>

          <Card className="flex flex-col items-center text-center p-6">
            <CardHeader>
              <Warehouse className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Inventory</CardTitle>
              <CardDescription>Manage raw materials and stock.</CardDescription>
            </CardHeader>
            <Link to="/inventory" className="mt-auto">
              <Button>Go to Inventory</Button>
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
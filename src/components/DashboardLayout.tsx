"use client";

import React from 'react';
import Header from './Header';
import { MadeWithDyad } from './made-with-dyad';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header />
      <main className="flex flex-col items-center p-4 flex-grow">
        {children}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default DashboardLayout;
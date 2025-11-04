"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-router';
import { toast } from 'sonner';
import NotificationsDropdown from './NotificationsDropdown';

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      toast.error(`Failed to sign out: ${signOutError.message}`);
    } else {
      toast.success("Signed out successfully!");
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold tracking-tight">SK INDUSTRIES</h1>
          <nav className="flex items-center space-x-4">
            <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link to="/customers" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Customers
            </Link>
            <Link to="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Products
            </Link>
            <Link to="/orders" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Orders
            </Link>
            <Link to="/inventory" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Inventory
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationsDropdown />
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
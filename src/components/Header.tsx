"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
        <h1 className="text-xl font-bold tracking-tight">SK INDUSTRIES</h1>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </header>
  );
};

export default Header;
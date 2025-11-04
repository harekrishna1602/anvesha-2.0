"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tables } from '@/types/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCustomer } from '@/services/customerService';
import { toast } from 'sonner';

interface EditCustomerDialogProps {
  customer: Tables<'customers'> | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditCustomerDialog: React.FC<EditCustomerDialogProps> = ({ customer, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState(customer?.name || '');
  const [contactPerson, setContactPerson] = useState(customer?.contactPerson || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setContactPerson(customer.contactPerson || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
    }
  }, [customer]);

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, updatedCustomer }: { id: string; updatedCustomer: Partial<Tables<'customers'>> }) =>
      updateCustomer(id, updatedCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully!');
      onClose();
    },
    onError: (err) => {
      toast.error(`Failed to update customer: ${err.message}`);
    },
  });

  const handleSave = () => {
    if (!customer) return;
    if (!name) {
      toast.error("Customer Name is required.");
      return;
    }

    updateCustomerMutation.mutate({
      id: customer.id,
      updatedCustomer: {
        name,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Make changes to the customer details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="name"
            placeholder="Customer Name (required)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
          />
          <Input
            id="contactPerson"
            placeholder="Contact Person"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            className="col-span-3"
          />
          <Input
            id="email"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="col-span-3"
          />
          <Input
            id="phone"
            placeholder="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="col-span-3"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateCustomerMutation.isPending}>
            {updateCustomerMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerDialog;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomer, getCustomers, deleteCustomer } from "@/services/customerService";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Edit } from "lucide-react";
import EditCustomerDialog from "@/components/EditCustomerDialog";
import { Tables } from '@/types/supabase';
import { useSession } from "@/components/SessionContextProvider";
import DashboardLayout from "@/components/DashboardLayout";

const Index = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newContactPerson, setNewContactPerson] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Tables<'customers'> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ["customers", searchTerm],
    queryFn: () => getCustomers(searchTerm),
  });

  const addCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setNewCustomerName("");
      setNewContactPerson("");
      setNewEmail("");
      setNewPhone("");
      toast.success("Customer added successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to add customer: ${err.message}`);
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to delete customer: ${err.message}`);
    },
  });

  const handleAddCustomer = () => {
    if (!newCustomerName) {
      toast.error("Customer Name is required.");
      return;
    }
    
    if (!session?.user?.id) {
      toast.error("User must be logged in to add a customer.");
      return;
    }

    addCustomerMutation.mutate({
      name: newCustomerName,
      contactPerson: newContactPerson || null,
      email: newEmail || null,
      phone: newPhone || null,
      user_id: session.user.id,
    });
  };

  const handleEditCustomer = (customer: Tables<'customers'>) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedCustomer(null);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-xl text-gray-600">Loading customers...</p>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-xl text-red-600">Error loading customers: {error.message}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl space-y-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Add New Customer</CardTitle>
            <CardDescription>Fill in the details to add a new customer to the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Customer Name (required)"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
            />
            <Input
              placeholder="Contact Person"
              value={newContactPerson}
              onChange={(e) => setNewContactPerson(e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Input
              placeholder="Phone"
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddCustomer} disabled={addCustomerMutation.isPending}>
              {addCustomerMutation.isPending ? "Adding..." : "Add Customer"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Existing Customers</CardTitle>
            <CardDescription>A list of all registered customers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search customers by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            {customers && customers.length > 0 ? (
              <ul className="space-y-2">
                {customers.map((customer) => (
                  <li key={customer.id} className="flex items-center justify-between p-2 border rounded-md bg-white">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.contactPerson && <p className="text-sm text-gray-600">{customer.contactPerson}</p>}
                      {customer.email && <p className="text-xs text-gray-500">{customer.email}</p>}
                      {customer.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteCustomerMutation.mutate(customer.id)}
                        disabled={deleteCustomerMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No customers found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedCustomer && (
        <EditCustomerDialog
          customer={selectedCustomer}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
        />
      )}
    </DashboardLayout>
  );
};

export default Index;
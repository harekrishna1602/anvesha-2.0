"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createAsset, getAssets, updateAsset, deleteAsset } from '@/services/assetService';
import { Tables } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Assets: React.FC = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetDescription, setNewAssetDescription] = useState('');
  const [newAssetSerialNumber, setNewAssetSerialNumber] = useState('');
  const [newAssetPurchaseDate, setNewAssetPurchaseDate] = useState<Date | undefined>(undefined);
  const [newAssetWarrantyExpiryDate, setNewAssetWarrantyExpiryDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Tables<'assets'> | null>(null);
  const [editAssetName, setEditAssetName] = useState('');
  const [editAssetDescription, setEditAssetDescription] = useState('');
  const [editAssetSerialNumber, setEditAssetSerialNumber] = useState('');
  const [editAssetPurchaseDate, setEditAssetPurchaseDate] = useState<Date | undefined>(undefined);
  const [editAssetWarrantyExpiryDate, setEditAssetWarrantyExpiryDate] = useState<Date | undefined>(undefined);

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['assets', searchTerm],
    queryFn: () => getAssets(searchTerm),
  });

  const addAssetMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setNewAssetName('');
      setNewAssetDescription('');
      setNewAssetSerialNumber('');
      setNewAssetPurchaseDate(undefined);
      setNewAssetWarrantyExpiryDate(undefined);
      toast.success('Asset added successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to add asset: ${err.message}`);
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, updatedAsset }: { id: string; updatedAsset: Partial<Tables<'assets'>> }) =>
      updateAsset(id, updatedAsset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedAsset(null);
    },
    onError: (err) => {
      toast.error(`Failed to update asset: ${err.message}`);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset deleted successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to delete asset: ${err.message}`);
    },
  });

  const handleAddAsset = () => {
    if (!newAssetName) {
      toast.error('Asset Name is required.');
      return;
    }
    if (!session?.user?.id) {
      toast.error("User must be logged in to add an asset.");
      return;
    }

    addAssetMutation.mutate({
      name: newAssetName,
      description: newAssetDescription || null,
      serial_number: newAssetSerialNumber || null,
      purchase_date: newAssetPurchaseDate ? format(newAssetPurchaseDate, 'yyyy-MM-dd') : null,
      warranty_expiry_date: newAssetWarrantyExpiryDate ? format(newAssetWarrantyExpiryDate, 'yyyy-MM-dd') : null,
      user_id: session.user.id,
    });
  };

  const handleEditClick = (asset: Tables<'assets'>) => {
    setSelectedAsset(asset);
    setEditAssetName(asset.name);
    setEditAssetDescription(asset.description || '');
    setEditAssetSerialNumber(asset.serial_number || '');
    setEditAssetPurchaseDate(asset.purchase_date ? new Date(asset.purchase_date) : undefined);
    setEditAssetWarrantyExpiryDate(asset.warranty_expiry_date ? new Date(asset.warranty_expiry_date) : undefined);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedAsset) return;
    if (!editAssetName) {
      toast.error('Asset Name is required.');
      return;
    }

    updateAssetMutation.mutate({
      id: selectedAsset.id,
      updatedAsset: {
        name: editAssetName,
        description: editAssetDescription || null,
        serial_number: editAssetSerialNumber || null,
        purchase_date: editAssetPurchaseDate ? format(editAssetPurchaseDate, 'yyyy-MM-dd') : null,
        warranty_expiry_date: editAssetWarrantyExpiryDate ? format(editAssetWarrantyExpiryDate, 'yyyy-MM-dd') : null,
      },
    });
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-gray-600 dark:text-gray-400">Loading assets...</p>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-red-600">Error loading assets: {error.message}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl space-y-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Add New Asset</CardTitle>
            <CardDescription>Register a new company asset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Asset Name (required)"
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
            />
            <Input
              placeholder="Description"
              value={newAssetDescription}
              onChange={(e) => setNewAssetDescription(e.target.value)}
            />
            <Input
              placeholder="Serial Number"
              value={newAssetSerialNumber}
              onChange={(e) => setNewAssetSerialNumber(e.target.value)}
            />
            <div className="flex items-center space-x-2">
              <Label htmlFor="new-purchase-date" className="w-32 text-right">Purchase Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newAssetPurchaseDate && "text-muted-foreground"
                    )}
                  >
                    {newAssetPurchaseDate ? format(newAssetPurchaseDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newAssetPurchaseDate}
                    onSelect={setNewAssetPurchaseDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="new-warranty-expiry-date" className="w-32 text-right">Warranty Expiry</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newAssetWarrantyExpiryDate && "text-muted-foreground"
                    )}
                  >
                    {newAssetWarrantyExpiryDate ? format(newAssetWarrantyExpiryDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newAssetWarrantyExpiryDate}
                    onSelect={setNewAssetWarrantyExpiryDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddAsset} disabled={addAssetMutation.isPending}>
              {addAssetMutation.isPending ? 'Adding...' : 'Add Asset'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Company Assets</CardTitle>
            <CardDescription>A list of all registered assets.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search assets by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            {assets && assets.length > 0 ? (
              <ul className="space-y-2">
                {assets.map((asset) => (
                  <li key={asset.id} className="flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-800">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{asset.name}</p>
                      {asset.serial_number && <p className="text-sm text-gray-600 dark:text-gray-400">S/N: {asset.serial_number}</p>}
                      {asset.description && <p className="text-xs text-gray-500 dark:text-gray-500">{asset.description}</p>}
                      {asset.purchase_date && <p className="text-xs text-gray-500 dark:text-gray-500">Purchased: {format(new Date(asset.purchase_date), 'PPP')}</p>}
                      {asset.warranty_expiry_date && <p className="text-xs text-gray-500 dark:text-gray-500">Warranty: {format(new Date(asset.warranty_expiry_date), 'PPP')}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditClick(asset)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteAssetMutation.mutate(asset.id)}
                        disabled={deleteAssetMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No assets found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedAsset && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Asset</DialogTitle>
              <DialogDescription>
                Make changes to the asset details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editAssetName}
                  onChange={(e) => setEditAssetName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  value={editAssetDescription}
                  onChange={(e) => setEditAssetDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-serial-number" className="text-right">
                  Serial Number
                </Label>
                <Input
                  id="edit-serial-number"
                  value={editAssetSerialNumber}
                  onChange={(e) => setEditAssetSerialNumber(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-purchase-date" className="text-right">Purchase Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal col-span-3",
                        !editAssetPurchaseDate && "text-muted-foreground"
                      )}
                    >
                      {editAssetPurchaseDate ? format(editAssetPurchaseDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editAssetPurchaseDate}
                      onSelect={setEditAssetPurchaseDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-warranty-expiry-date" className="text-right">Warranty Expiry</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal col-span-3",
                        !editAssetWarrantyExpiryDate && "text-muted-foreground"
                      )}
                    >
                      {editAssetWarrantyExpiryDate ? format(editAssetWarrantyExpiryDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editAssetWarrantyExpiryDate}
                      onSelect={setEditAssetWarrantyExpiryDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={updateAssetMutation.isPending}>
                {updateAssetMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default Assets;
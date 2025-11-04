"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createRawMaterial, getRawMaterials, updateRawMaterial, deleteRawMaterial } from '@/services/rawMaterialService';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Inventory: React.FC = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newCurrentStock, setNewCurrentStock] = useState('');
  const [newReorderThreshold, setNewReorderThreshold] = useState('');
  const [newUnitOfMeasure, setNewUnitOfMeasure] = useState('units');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Tables<'raw_materials'> | null>(null);
  const [editMaterialName, setEditMaterialName] = useState('');
  const [editCurrentStock, setEditCurrentStock] = useState('');
  const [editReorderThreshold, setEditReorderThreshold] = useState('');
  const [editUnitOfMeasure, setEditUnitOfMeasure] = useState('units');

  const { data: rawMaterials, isLoading, error } = useQuery({
    queryKey: ['raw_materials', searchTerm],
    queryFn: () => getRawMaterials(searchTerm),
  });

  const addRawMaterialMutation = useMutation({
    mutationFn: createRawMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw_materials'] });
      setNewMaterialName('');
      setNewCurrentStock('');
      setNewReorderThreshold('');
      setNewUnitOfMeasure('units');
      toast.success('Raw material added successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to add raw material: ${err.message}`);
    },
  });

  const updateRawMaterialMutation = useMutation({
    mutationFn: ({ id, updatedMaterial }: { id: string; updatedMaterial: Partial<Tables<'raw_materials'>> }) =>
      updateRawMaterial(id, updatedMaterial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw_materials'] });
      toast.success('Raw material updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedMaterial(null);
    },
    onError: (err) => {
      toast.error(`Failed to update raw material: ${err.message}`);
    },
  });

  const deleteRawMaterialMutation = useMutation({
    mutationFn: deleteRawMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw_materials'] });
      toast.success('Raw material deleted successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to delete raw material: ${err.message}`);
    },
  });

  const handleAddRawMaterial = () => {
    if (!newMaterialName || !newCurrentStock || !newReorderThreshold) {
      toast.error('Name, Current Stock, and Re-order Threshold are required.');
      return;
    }
    if (isNaN(parseFloat(newCurrentStock)) || parseFloat(newCurrentStock) < 0) {
      toast.error('Current Stock must be a non-negative number.');
      return;
    }
    if (isNaN(parseFloat(newReorderThreshold)) || parseFloat(newReorderThreshold) < 0) {
      toast.error('Re-order Threshold must be a non-negative number.');
      return;
    }
    if (!session?.user?.id) {
      toast.error("User must be logged in to add a raw material.");
      return;
    }

    addRawMaterialMutation.mutate({
      name: newMaterialName,
      current_stock: parseFloat(newCurrentStock),
      reorder_threshold: parseFloat(newReorderThreshold),
      unit_of_measure: newUnitOfMeasure,
      user_id: session.user.id,
    });
  };

  const handleEditClick = (material: Tables<'raw_materials'>) => {
    setSelectedMaterial(material);
    setEditMaterialName(material.name);
    setEditCurrentStock(material.current_stock.toString());
    setEditReorderThreshold(material.reorder_threshold.toString());
    setEditUnitOfMeasure(material.unit_of_measure);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedMaterial) return;
    if (!editMaterialName || !editCurrentStock || !editReorderThreshold) {
      toast.error('Name, Current Stock, and Re-order Threshold are required.');
      return;
    }
    if (isNaN(parseFloat(editCurrentStock)) || parseFloat(editCurrentStock) < 0) {
      toast.error('Current Stock must be a non-negative number.');
      return;
    }
    if (isNaN(parseFloat(editReorderThreshold)) || parseFloat(editReorderThreshold) < 0) {
      toast.error('Re-order Threshold must be a non-negative number.');
      return;
    }

    updateRawMaterialMutation.mutate({
      id: selectedMaterial.id,
      updatedMaterial: {
        name: editMaterialName,
        current_stock: parseFloat(editCurrentStock),
        reorder_threshold: parseFloat(editReorderThreshold),
        unit_of_measure: editUnitOfMeasure,
      },
    });
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-gray-600 dark:text-gray-400">Loading inventory...</p>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-red-600">Error loading inventory: {error.message}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl space-y-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Add New Raw Material</CardTitle>
            <CardDescription>Define a new raw material for your inventory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Material Name (required)"
              value={newMaterialName}
              onChange={(e) => setNewMaterialName(e.target.value)}
            />
            <Input
              placeholder="Current Stock (required)"
              type="number"
              step="0.01"
              value={newCurrentStock}
              onChange={(e) => setNewCurrentStock(e.target.value)}
            />
            <Input
              placeholder="Re-order Threshold (required)"
              type="number"
              step="0.01"
              value={newReorderThreshold}
              onChange={(e) => setNewReorderThreshold(e.target.value)}
            />
            <Select value={newUnitOfMeasure} onValueChange={setNewUnitOfMeasure}>
              <SelectTrigger>
                <SelectValue placeholder="Unit of Measure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="units">Units</SelectItem>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="liters">Liters</SelectItem>
                <SelectItem value="meters">Meters</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddRawMaterial} disabled={addRawMaterialMutation.isPending}>
              {addRawMaterialMutation.isPending ? 'Adding...' : 'Add Raw Material'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Raw Materials Inventory</CardTitle>
            <CardDescription>Manage your raw material stock levels and re-order thresholds.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search raw materials by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            {rawMaterials && rawMaterials.length > 0 ? (
              <ul className="space-y-2">
                {rawMaterials.map((material) => (
                  <li key={material.id} className="flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-800">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{material.name}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Stock: <span className={material.current_stock <= material.reorder_threshold ? 'text-red-500 font-semibold' : ''}>
                          {material.current_stock} {material.unit_of_measure}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Re-order: {material.reorder_threshold} {material.unit_of_measure}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditClick(material)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteRawMaterialMutation.mutate(material.id)}
                        disabled={deleteRawMaterialMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No raw materials found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedMaterial && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Raw Material</DialogTitle>
              <DialogDescription>
                Make changes to the raw material details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editMaterialName}
                  onChange={(e) => setEditMaterialName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-current-stock" className="text-right">
                  Current Stock
                </Label>
                <Input
                  id="edit-current-stock"
                  type="number"
                  step="0.01"
                  value={editCurrentStock}
                  onChange={(e) => setEditCurrentStock(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-reorder-threshold" className="text-right">
                  Re-order Threshold
                </Label>
                <Input
                  id="edit-reorder-threshold"
                  type="number"
                  step="0.01"
                  value={editReorderThreshold}
                  onChange={(e) => setEditReorderThreshold(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-unit-of-measure" className="text-right">
                  Unit
                </Label>
                <Select value={editUnitOfMeasure} onValueChange={setEditUnitOfMeasure}>
                  <SelectTrigger id="edit-unit-of-measure" className="col-span-3">
                    <SelectValue placeholder="Unit of Measure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="units">Units</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={updateRawMaterialMutation.isPending}>
                {updateRawMaterialMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default Inventory;
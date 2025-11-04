"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, getProducts, updateProduct, deleteProduct } from '@/services/productService';
import { Tables } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

const Products: React.FC = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Tables<'products'> | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductDescription, setEditProductDescription] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => getProducts(searchTerm),
  });

  const addProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setNewProductName('');
      setNewProductDescription('');
      setNewProductPrice('');
      toast.success('Product added successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to add product: ${err.message}`);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, updatedProduct }: { id: string; updatedProduct: Partial<Tables<'products'>> }) =>
      updateProduct(id, updatedProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (err) => {
      toast.error(`Failed to update product: ${err.message}`);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to delete product: ${err.message}`);
    },
  });

  const handleAddProduct = () => {
    if (!newProductName || !newProductPrice) {
      toast.error('Product Name and Price are required.');
      return;
    }
    if (isNaN(parseFloat(newProductPrice)) || parseFloat(newProductPrice) <= 0) {
      toast.error('Price must be a positive number.');
      return;
    }
    if (!session?.user?.id) {
      toast.error("User must be logged in to add a product.");
      return;
    }

    addProductMutation.mutate({
      name: newProductName,
      description: newProductDescription || null,
      price: parseFloat(newProductPrice),
      user_id: session.user.id,
    });
  };

  const handleEditClick = (product: Tables<'products'>) => {
    setSelectedProduct(product);
    setEditProductName(product.name);
    setEditProductDescription(product.description || '');
    setEditProductPrice(product.price.toString());
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedProduct) return;
    if (!editProductName || !editProductPrice) {
      toast.error('Product Name and Price are required.');
      return;
    }
    if (isNaN(parseFloat(editProductPrice)) || parseFloat(editProductPrice) <= 0) {
      toast.error('Price must be a positive number.');
      return;
    }

    updateProductMutation.mutate({
      id: selectedProduct.id,
      updatedProduct: {
        name: editProductName,
        description: editProductDescription || null,
        price: parseFloat(editProductPrice),
      },
    });
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-gray-600 dark:text-gray-400">Loading products...</p>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <p className="text-xl text-red-600">Error loading products: {error.message}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl space-y-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Add New Product</CardTitle>
            <CardDescription>Define a new product for your inventory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Product Name (required)"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
            />
            <Input
              placeholder="Description"
              value={newProductDescription}
              onChange={(e) => setNewProductDescription(e.target.value)}
            />
            <Input
              placeholder="Price (required)"
              type="number"
              step="0.01"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddProduct} disabled={addProductMutation.isPending}>
              {addProductMutation.isPending ? 'Adding...' : 'Add Product'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Existing Products</CardTitle>
            <CardDescription>Manage your product catalog.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            {products && products.length > 0 ? (
              <ul className="space-y-2">
                {products.map((product) => (
                  <li key={product.id} className="flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-800">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                      {product.description && <p className="text-sm text-gray-600 dark:text-gray-400">{product.description}</p>}
                      <p className="text-sm text-gray-700 dark:text-gray-300">₹{product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditClick(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                        disabled={deleteProductMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No products found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Make changes to the product details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  value={editProductDescription}
                  onChange={(e) => setEditProductDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                  Price
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editProductPrice}
                  onChange={(e) => setEditProductPrice(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={updateProductMutation.isPending}>
                {updateProductMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default Products;
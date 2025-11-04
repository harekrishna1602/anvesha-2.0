import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables } from '@/types/supabase';

export const createProduct = async (product: Omit<TablesInsert<'products'>, 'user_id'> & { user_id: string }) => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select();
  if (error) throw error;
  return data[0];
};

export const getProducts = async (searchTerm?: string): Promise<Tables<'products'>[]> => {
  let query = supabase
    .from('products')
    .select('*');

  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getProductById = async (id: string): Promise<Tables<'products'> | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const updateProduct = async (id: string, product: Partial<TablesInsert<'products'>>) => {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};
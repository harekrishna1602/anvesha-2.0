import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables } from '@/types/supabase';

export const createCustomer = async (customer: Omit<TablesInsert<'customers'>, 'user_id'> & { user_id: string }) => {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select();
  if (error) throw error;
  return data[0];
};

export const getCustomers = async (searchTerm?: string): Promise<Tables<'customers'>[]> => {
  let query = supabase
    .from('customers')
    .select('*');

  if (searchTerm) {
    // RLS will automatically filter by user_id, we only need to filter by search term
    query = query.ilike('name', `%${searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateCustomer = async (id: string, customer: Partial<TablesInsert<'customers'>>) => {
  // RLS ensures only the owner can update this row
  const { data, error } = await supabase
    .from('customers')
    .update(customer)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteCustomer = async (id: string) => {
  // RLS ensures only the owner can delete this row
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};
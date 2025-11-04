import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables } from '@/types/supabase';

export const createCustomer = async (customer: TablesInsert<'Customers'>) => {
  const { data, error } = await supabase
    .from('Customers')
    .insert(customer)
    .select();
  if (error) throw error;
  return data[0];
};

export const getCustomers = async (searchTerm?: string): Promise<Tables<'Customers'>[]> => {
  let query = supabase
    .from('Customers')
    .select('*');

  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateCustomer = async (id: string, customer: Partial<TablesInsert<'Customers'>>) => {
  const { data, error } = await supabase
    .from('Customers')
    .update(customer)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteCustomer = async (id: string) => {
  const { error } = await supabase
    .from('Customers')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables } from '@/types/supabase';

export const createRawMaterial = async (rawMaterial: Omit<TablesInsert<'raw_materials'>, 'user_id'> & { user_id: string }) => {
  const { data, error } = await supabase
    .from('raw_materials')
    .insert(rawMaterial)
    .select();
  if (error) throw error;
  return data[0];
};

export const getRawMaterials = async (searchTerm?: string): Promise<Tables<'raw_materials'>[]> => {
  let query = supabase
    .from('raw_materials')
    .select('*');

  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateRawMaterial = async (id: string, rawMaterial: Partial<TablesInsert<'raw_materials'>>) => {
  const { data, error } = await supabase
    .from('raw_materials')
    .update(rawMaterial)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteRawMaterial = async (id: string) => {
  const { error } = await supabase
    .from('raw_materials')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};
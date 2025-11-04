import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables } from '@/types/supabase';

export const createAsset = async (asset: Omit<TablesInsert<'assets'>, 'user_id'> & { user_id: string }) => {
  const { data, error } = await supabase
    .from('assets')
    .insert(asset)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getAssets = async (searchTerm?: string): Promise<Tables<'assets'>[]> => {
  let query = supabase
    .from('assets')
    .select('*');

  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getAssetById = async (id: string): Promise<Tables<'assets'> | null> => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const updateAsset = async (id: string, asset: Partial<TablesInsert<'assets'>>) => {
  const { data, error } = await supabase
    .from('assets')
    .update(asset)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAsset = async (id: string) => {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};
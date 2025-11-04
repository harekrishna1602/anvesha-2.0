import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables, Enums } from '@/types/supabase';

export interface MaintenanceTaskWithDetails extends Tables<'maintenance_tasks'> {
  assets: Tables<'assets'>;
  maintenance_checklist_items: Tables<'maintenance_checklist_items'>[];
}

export const createMaintenanceTask = async (
  task: Omit<TablesInsert<'maintenance_tasks'>, 'user_id'> & { user_id: string },
  checklistItems: Omit<TablesInsert<'maintenance_checklist_items'>, 'task_id'>[]
) => {
  const { data: taskData, error: taskError } = await supabase
    .from('maintenance_tasks')
    .insert(task)
    .select()
    .single();

  if (taskError) throw taskError;

  if (checklistItems.length > 0) {
    const itemsWithTaskId = checklistItems.map(item => ({ ...item, task_id: taskData.id }));
    const { data: checklistData, error: checklistError } = await supabase
      .from('maintenance_checklist_items')
      .insert(itemsWithTaskId)
      .select();

    if (checklistError) throw checklistError;
    return { task: taskData, checklistItems: checklistData };
  }

  return { task: taskData, checklistItems: [] };
};

export const getMaintenanceTasks = async (
  statusFilter?: Enums<'maintenance_status'>,
  searchTerm?: string,
  assetId?: string
): Promise<MaintenanceTaskWithDetails[]> => {
  let query = supabase
    .from('maintenance_tasks')
    .select('*, assets(*), maintenance_checklist_items(*)')
    .order('scheduled_date', { ascending: true });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }
  if (searchTerm) {
    query = query.ilike('title', `%${searchTerm}%`);
  }
  if (assetId) {
    query = query.eq('asset_id', assetId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as MaintenanceTaskWithDetails[];
};

export const getMaintenanceTaskById = async (id: string): Promise<MaintenanceTaskWithDetails | null> => {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select('*, assets(*), maintenance_checklist_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as MaintenanceTaskWithDetails;
};

export const updateMaintenanceTask = async (
  id: string,
  task: Partial<TablesInsert<'maintenance_tasks'>>,
  checklistItemsToUpdate: Tables<'maintenance_checklist_items'>[],
  checklistItemsToDelete: string[],
  checklistItemsToAdd: Omit<TablesInsert<'maintenance_checklist_items'>, 'task_id'>[]
) => {
  const { data: taskData, error: taskError } = await supabase
    .from('maintenance_tasks')
    .update(task)
    .eq('id', id)
    .select()
    .single();

  if (taskError) throw taskError;

  // Update existing checklist items
  const updatePromises = checklistItemsToUpdate.map(item =>
    supabase.from('maintenance_checklist_items').update({ is_completed: item.is_completed, description: item.description }).eq('id', item.id)
  );

  // Delete checklist items
  const deletePromises = checklistItemsToDelete.map(itemId =>
    supabase.from('maintenance_checklist_items').delete().eq('id', itemId)
  );

  // Add new checklist items
  const addPromises = checklistItemsToAdd.map(item =>
    supabase.from('maintenance_checklist_items').insert({ ...item, task_id: id })
  );

  await Promise.all([...updatePromises, ...deletePromises, ...addPromises]);

  return taskData;
};

export const deleteMaintenanceTask = async (id: string) => {
  const { error } = await supabase
    .from('maintenance_tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

export const getMaintenanceTasksForCalendar = async (
  start: Date,
  end: Date,
  userId: string
): Promise<MaintenanceTaskWithDetails[]> => {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select('*, assets(*)')
    .eq('user_id', userId)
    .gte('scheduled_date', start.toISOString().split('T')[0])
    .lte('scheduled_date', end.toISOString().split('T')[0])
    .order('scheduled_date', { ascending: true });

  if (error) throw error;
  return data as MaintenanceTaskWithDetails[];
};
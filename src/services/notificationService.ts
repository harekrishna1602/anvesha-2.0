import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables } from '@/types/supabase';

export const getNotifications = async (userId: string): Promise<Tables<'notifications'>[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select();
  if (error) throw error;
  return data[0];
};

export const createNotification = async (notification: Omit<TablesInsert<'notifications'>, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select();
  if (error) throw error;
  return data[0];
};
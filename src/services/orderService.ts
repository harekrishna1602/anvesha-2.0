import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables, Enums } from '@/types/supabase';

export interface OrderWithDetails extends Tables<'orders'> {
  customers: Tables<'customers'>;
  order_items: (Tables<'order_items'> & { products: Tables<'products'> })[];
}

export const createOrder = async (order: Omit<TablesInsert<'orders'>, 'user_id'> & { user_id: string }, items: TablesInsert<'order_items'>[]) => {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (orderError) throw orderError;

  const orderId = orderData.id;
  const itemsWithOrderId = items.map(item => ({ ...item, order_id: orderId }));

  const { data: orderItemsData, error: orderItemsError } = await supabase
    .from('order_items')
    .insert(itemsWithOrderId)
    .select();

  if (orderItemsError) throw orderItemsError;

  return { order: orderData, items: orderItemsData };
};

export const getOrders = async (statusFilter?: Enums<'order_status'>, searchTerm?: string): Promise<OrderWithDetails[]> => {
  let query = supabase
    .from('orders')
    .select('*, customers(*), order_items(id, quantity, unit_price, products(*))');

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  if (searchTerm) {
    query = query.ilike('customers.name', `%${searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as OrderWithDetails[];
};

export const getOrderById = async (id: string): Promise<OrderWithDetails | null> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(*), order_items(id, quantity, unit_price, products(*))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as OrderWithDetails;
};

export const updateOrder = async (id: string, order: Partial<TablesInsert<'orders'>>) => {
  const { data, error } = await supabase
    .from('orders')
    .update(order)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteOrder = async (id: string) => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

export const updateOrderItem = async (id: string, item: Partial<TablesInsert<'order_items'>>) => {
  const { data, error } = await supabase
    .from('order_items')
    .update(item)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteOrderItem = async (id: string) => {
  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

export const getPendingOrdersCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending');
  if (error) throw error;
  return count || 0;
};

export const getReadyForDispatchOrdersCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Ready for Dispatch');
  if (error) throw error;
  return count || 0;
};

export const getRecentOrders = async (limit: number = 5): Promise<OrderWithDetails[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(*), order_items(id, quantity, unit_price, products(*))')
    .order('order_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as OrderWithDetails[];
};
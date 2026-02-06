import { supabase } from './supabase';
import { MenuItem, AppSettings, Category } from '../types';
import { INITIAL_MENU, INITIAL_SETTINGS } from '../constants';

// --- Menu Operations ---

export const getMenu = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching menu:', error);
    throw error;
  }

  // If DB is empty, seed it with initial data
  if (!data || data.length === 0) {
    // Seed Items
    const { data: seededData } = await supabase
      .from('menu_items')
      .insert(INITIAL_MENU.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        available: item.available
      })))
      .select();
    
    // Seed Categories
    const categories = Array.from(new Set(INITIAL_MENU.map(i => i.category)));
    await supabase.from('categories').insert(categories.map((name, index) => ({ name, sort_order: index })));

    return seededData ? seededData.map(mapToMenuItem) : [];
  }

  return data.map(mapToMenuItem);
};

export const upsertMenuItem = async (item: MenuItem): Promise<MenuItem> => {
  const { data, error } = await supabase
    .from('menu_items')
    .upsert({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      available: item.available
    })
    .select()
    .single();

  if (error) throw error;
  return mapToMenuItem(data);
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// --- Category Operations ---

export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const addCategory = async (name: string): Promise<void> => {
  const { error } = await supabase.from('categories').insert({ name });
  if (error) throw error;
};

export const updateCategoryName = async (oldName: string, newName: string): Promise<void> => {
  // Update the category definition
  const { error: catError } = await supabase
    .from('categories')
    .update({ name: newName })
    .eq('name', oldName);

  if (catError) throw catError;

  // Update all items that use this category
  const { error: itemError } = await supabase
    .from('menu_items')
    .update({ category: newName })
    .eq('category', oldName);

  if (itemError) throw itemError;
};

export const deleteCategory = async (name: string): Promise<void> => {
  // 1. Update items to 'Uncategorized'
  await supabase
    .from('menu_items')
    .update({ category: 'Uncategorized' })
    .eq('category', name);

  // 2. Delete from categories table
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('name', name);

  if (error) throw error;
};

export const updateCategoryOrder = async (categories: Category[]): Promise<void> => {
  // Bulk update sort_order. Supabase/Postgres doesn't have a simple bulk update for different values
  // so we loop. For a menu category list (usually < 20 items), this is fine.
  for (const cat of categories) {
    await supabase
      .from('categories')
      .update({ sort_order: cat.sort_order })
      .eq('id', cat.id);
  }
};

// --- Settings Operations ---

export const getSettings = async (): Promise<AppSettings> => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') { 
    console.error('Error fetching settings:', error);
  }

  if (!data) {
    await saveSettings(INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  }

  return mapToAppSettings(data);
};

export const saveSettings = async (settings: AppSettings): Promise<AppSettings> => {
  const { data, error } = await supabase
    .from('settings')
    .upsert({
      id: 1, 
      restaurant_name: settings.restaurantName,
      telegram_bot_token: settings.telegramBotToken,
      telegram_chat_id: settings.telegramChatId,
      currency: settings.currency
    })
    .select()
    .single();

  if (error) throw error;
  return mapToAppSettings(data);
};

// --- Mappers ---

const mapToMenuItem = (dbItem: any): MenuItem => ({
  id: dbItem.id.toString(),
  name: dbItem.name,
  description: dbItem.description,
  price: dbItem.price,
  category: dbItem.category || 'Uncategorized',
  image: dbItem.image,
  available: dbItem.available
});

const mapToAppSettings = (dbItem: any): AppSettings => ({
  restaurantName: dbItem.restaurant_name,
  telegramBotToken: dbItem.telegram_bot_token || '',
  telegramChatId: dbItem.telegram_chat_id || '',
  currency: dbItem.currency || '$'
});

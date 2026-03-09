import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const url = (import.meta as any).env.VITE_SUPABASE_URL;
  const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'https://your-project-url.supabase.co' || !url.startsWith('http')) {
    return null;
  }

  try {
    return createClient(url, key);
  } catch (e) {
    console.error('Failed to initialize Supabase:', e);
    return null;
  }
};

export const supabase = getSupabaseClient();

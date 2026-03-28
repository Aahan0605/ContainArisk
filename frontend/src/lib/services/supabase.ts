import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client if env vars are present.
// If not, we will mock the functionality to ensure the UI builds and runs without errors.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const saveContainer = async (data: any) => {
  if (!supabase) {
    console.warn("Supabase credentials not found. Mocking save operation:", data);
    return new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency
  }

  const { data: result, error } = await supabase
    .from('historical_data') // The prompt mentions historical_data.csv / realtime_data.csv equivalent
    .insert([data])
    .select();

  if (error) throw error;
  return result;
};

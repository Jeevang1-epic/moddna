import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const createSupabaseClient = (
  supabaseUrl: string,
  supabaseAnonKey: string
): SupabaseClient => createClient(supabaseUrl, supabaseAnonKey);

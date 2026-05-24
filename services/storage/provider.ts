import type { SupabaseClient } from '@supabase/supabase-js';
import type Database from 'better-sqlite3';
import type { AppEnv } from '../../lib/config/env';
import { createSupabaseClient } from './supabase/client';
import { createSqliteClient } from './sqlite/client';

export type StorageProvider =
  | {
      kind: 'supabase';
      client: SupabaseClient;
    }
  | {
      kind: 'sqlite';
      client: Database.Database;
    };

export const createStorageProvider = (env: AppEnv): StorageProvider => {
  if (env.storageDriver === 'supabase') {
    return {
      kind: 'supabase',
      client: createSupabaseClient(env.supabaseUrl!, env.supabaseAnonKey!),
    };
  }

  return {
    kind: 'sqlite',
    client: createSqliteClient(env.sqlitePath),
  };
};

export type StorageDriver = 'supabase' | 'sqlite';

export type AppEnv = {
  storageDriver: StorageDriver;
  sqlitePath: string;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
};

const readStorageDriver = (): StorageDriver => {
  const rawValue = (
    process.env.MODDNA_STORAGE_DRIVER ?? 'sqlite'
  ).toLowerCase();
  if (rawValue === 'supabase' || rawValue === 'sqlite') {
    return rawValue;
  }

  throw new Error(
    'MODDNA_STORAGE_DRIVER must be either "supabase" or "sqlite".'
  );
};

export const readAppEnv = (): AppEnv => {
  const storageDriver = readStorageDriver();
  const sqlitePath = process.env.MODDNA_SQLITE_PATH ?? './data/moddna.sqlite';
  const supabaseUrl = process.env.SUPABASE_URL ?? null;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? null;

  if (storageDriver === 'supabase') {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY are required when MODDNA_STORAGE_DRIVER is "supabase".'
      );
    }
  }

  return {
    storageDriver,
    sqlitePath,
    supabaseUrl,
    supabaseAnonKey,
  };
};

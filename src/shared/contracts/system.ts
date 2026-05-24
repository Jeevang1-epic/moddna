export type HealthResponse = {
  status: 'ok';
  app: string;
  version: string;
  storageDriver: 'supabase' | 'sqlite';
};

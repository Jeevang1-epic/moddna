import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const createSqliteClient = (databasePath: string): Database.Database => {
  mkdirSync(dirname(databasePath), { recursive: true });
  return new Database(databasePath);
};

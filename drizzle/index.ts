import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { eq, like, or } from 'drizzle-orm';
import { join } from 'path';

// Get the database path from environment variable or use default
const dbPath = process.env.DATABASE_URL?.replace('file:', '').trim() || './dev.db';

// Initialize the SQLite database
const sqlite = new Database(join(process.cwd(), dbPath));

// Create the Drizzle database instance with prepared queries
export const db = drizzle(sqlite, { 
  schema,
});

// Export commonly used operators and schema
export { schema, eq, like, or };

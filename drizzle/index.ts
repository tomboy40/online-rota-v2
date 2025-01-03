import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { eq, like, or } from 'drizzle-orm';

// Get the database path from environment variable or use default
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

// Initialize the LibSQL client
const client = createClient({
  url: dbUrl
});

// Create the Drizzle database instance
export const db = drizzle(client, { schema });

// Export commonly used operators and schema
export { schema, eq, like, or };

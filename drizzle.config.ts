import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle',
  driver: 'libsql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./dev.db'
  },
} satisfies Config;

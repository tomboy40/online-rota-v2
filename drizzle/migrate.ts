import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';

// This will run migrations on the database, skipping the ones already applied
console.log('Running migrations...');
migrate(db, { migrationsFolder: './drizzle/migrations' });
console.log('Migrations completed!');

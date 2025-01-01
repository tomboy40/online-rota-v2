import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const calendar = sqliteTable('Calendar', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  icalLink: text('icalLink').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

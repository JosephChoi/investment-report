import { pgTable, uuid, varchar, timestamp, foreignKey } from 'drizzle-orm/pg-core';
import { users } from './users';

// 계좌 테이블 정의
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  account_number: varchar('account_number', { length: 50 }).notNull().unique(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  portfolio_type: varchar('portfolio_type', { length: 100 }).notNull(),
  contract_date: timestamp('contract_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}); 
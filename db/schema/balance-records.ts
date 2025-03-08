import { pgTable, uuid, timestamp, numeric, foreignKey } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';

// 잔고 기록 테이블 정의
export const balanceRecords = pgTable('balance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  account_id: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  balance: numeric('balance', { precision: 18, scale: 2 }).notNull(),
  record_date: timestamp('record_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}); 
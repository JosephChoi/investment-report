import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';

// 포트폴리오 타입 테이블 정의
export const portfolioTypes = pgTable('portfolio_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }),
  risk_level: integer('risk_level'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}); 
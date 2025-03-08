import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

// 포트폴리오 리포트 테이블 정의
export const portfolioReports = pgTable('portfolio_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  portfolio_type: varchar('portfolio_type', { length: 100 }).notNull(),
  report_url: text('report_url').notNull(),
  report_date: timestamp('report_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}); 
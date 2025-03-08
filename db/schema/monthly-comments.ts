import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';

// 월간 코멘트 테이블 정의
export const monthlyComments = pgTable('monthly_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  comment_date: timestamp('comment_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}); 
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

// 사용자 역할 타입 정의
export const userRoles = ['admin', 'user'] as const;
export type UserRole = typeof userRoles[number];

// 사용자 테이블 정의
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  role: varchar('role', { length: 10 }).notNull().default('user').$type<UserRole>(),
}); 
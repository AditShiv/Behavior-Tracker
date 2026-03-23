import { pgTable, serial, varchar, integer, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const redemptionStatusEnum = pgEnum("redemption_status", ["pending", "accepted", "denied"]);

export const pointsTable = pgTable("points", {
  userId: varchar("user_id").primaryKey().references(() => usersTable.id),
  points: integer("points").notNull().default(500),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const pointsHistoryTable = pgTable("points_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const redemptionsTable = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  robuxAmount: integer("robux_amount").notNull(),
  pointsCost: integer("points_cost").notNull(),
  status: redemptionStatusEnum("status").notNull().default("pending"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  donated: boolean("donated").notNull().default(false),
  donatedAt: timestamp("donated_at", { withTimezone: true }),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appConfigTable = pgTable("app_config", {
  key: varchar("key").primaryKey(),
  value: text("value").notNull(),
});

export type Points = typeof pointsTable.$inferSelect;
export type PointsHistory = typeof pointsHistoryTable.$inferSelect;
export type Redemption = typeof redemptionsTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
export type AppConfig = typeof appConfigTable.$inferSelect;

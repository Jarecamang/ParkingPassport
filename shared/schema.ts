import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Vehicle schema
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plateNumber: text("plate_number").notNull().unique(),
  apartment: text("apartment").notNull(),
  owner: text("owner").notNull(),
  make: text("make"),
  model: text("model"),
  color: text("color"),
  permitted: boolean("permitted").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  plateNumber: true,
  apartment: true,
  owner: true,
  make: true,
  model: true,
  color: true,
  permitted: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// Search history schema
export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  plateNumber: text("plate_number").notNull(),
  allowed: boolean("allowed").notNull(),
  apartment: text("apartment"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).pick({
  plateNumber: true,
  allowed: true,
  apartment: true,
});

export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
export type SearchHistory = typeof searchHistory.$inferSelect;

// Admin settings schema
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  password: text("password").notNull(),
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).pick({
  password: true,
});

export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;

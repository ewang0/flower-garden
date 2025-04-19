import { integer, pgTable, serial, text, timestamp, varchar, json, real } from "drizzle-orm/pg-core";

// New flowers_rows table based on the provided data
export const flowersTable = pgTable("flowers", {
  id: integer("id").primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  petal_count: integer("petal_count").notNull(),
  petal_length: real("petal_length").notNull(),
  petal_width: real("petal_width").notNull(),
  stem_height: real("stem_height").notNull(),
  petal_color: varchar("petal_color", { length: 7 }).notNull(), // Hex color format
  center_color: varchar("center_color", { length: 7 }).notNull(), // Hex color format
  stem_color: varchar("stem_color", { length: 7 }).notNull(), // Hex color format
  seed: integer("seed").notNull(),
  position: json("position").notNull(), // Storing [x, y, z] coordinates as JSON
  planted_at: timestamp("planted_at").notNull(),
  last_watered: timestamp("last_watered").notNull(),
  water_count: integer("water_count").notNull(),
});
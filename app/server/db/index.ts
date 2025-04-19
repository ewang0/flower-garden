import "dotenv/config";
import fs from "fs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { flowersTable } from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Create postgres client
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function main() {
  // Test flower creation
  const flower: typeof flowersTable.$inferInsert = {
    id: 1,
    username: "user1",
    petal_count: 5,
    petal_length: 3,
    petal_width: 5,
    stem_height: 8,
    petal_color: "#FF5733",
    center_color: "#FFC300",
    stem_color: "#28B463",
    seed: 12345,
    position: [0, 0, 0],
    planted_at: new Date(),
    last_watered: new Date(),
    water_count: 1,
    userId: "user123",
  };
  
  try {
    // Insert a test flower
    await db.insert(flowersTable).values(flower);
    console.log("New flower created!");
    
    // Query all flowers
    const flowers = await db.select().from(flowersTable);
    console.log("Getting all flowers from the database: ", flowers);
    
    // Update a flower
    await db
      .update(flowersTable)
      .set({
        water_count: 2,
        last_watered: new Date(),
      })
      .where(eq(flowersTable.id, flower.id));
    console.log("Flower watered!");
    
    // Get the updated flower
    const updatedFlower = await db
      .select()
      .from(flowersTable)
      .where(eq(flowersTable.id, flower.id));
    console.log("Updated flower: ", updatedFlower);
    
    // Uncomment to test deletion
    // await db.delete(flowersTable).where(eq(flowersTable.id, flower.id));
    // console.log('Flower deleted!');
  } catch (error) {
    console.error("Error in database operations:", error);
  } finally {
    // Close the connection
    await client.end();
  }
}

// Export the database instance for use in other files
export { db };

// Run the test function if this file is executed directly
if (require.main === module) {
  main();
}
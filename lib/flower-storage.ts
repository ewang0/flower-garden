import { supabase } from "./supabaseClient";

// Types for stored flowers
export interface PlantedFlower {
  id: string; // Corresponds to Supabase UUID primary key
  username: string;
  petalCount: number;
  petalLength: number;
  petalWidth: number;
  stemHeight: number;
  petalColor: string;
  centerColor: string;
  stemColor: string;
  seed: number;
  position: [number, number, number]; // Stored as JSONB in Supabase
  plantedAt: string; // Changed to string (ISO 8601 timestamp) for Supabase TIMESTAMPTZ compatibility
  lastWatered?: string | null; // Changed to string (ISO 8601 timestamp)
  waterCount?: number;
}

// Define the table name
const TABLE_NAME = "flowers";

// Get all planted flowers
export const getPlantedFlowers = async (): Promise<PlantedFlower[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("plantedAt", { ascending: false }); // Example ordering

  if (error) {
    console.error("Error fetching flowers:", error);
    return [];
  }
  // Ensure position is always an array, handle potential null/incorrect types from DB
  return (data || []).map((flower) => ({
    ...flower,
    position:
      Array.isArray(flower.position) && flower.position.length === 3
        ? flower.position
        : [0, 0, 0], // Provide default if invalid
    plantedAt: flower.plantedAt || new Date(0).toISOString(), // Provide default if null
    lastWatered: flower.lastWatered, // Keep as null if it is null
  }));
};

// Plant a new flower
export const plantFlower = async (
  flowerData: Omit<PlantedFlower, "id" | "plantedAt">
): Promise<PlantedFlower | null> => {
  // Adjust the y-position based on stem height (client-side logic, keep it here)
  const position: [number, number, number] = [
    flowerData.position[0],
    flowerData.position[1],
    flowerData.position[2],
  ];
  if (flowerData.stemHeight > 4) {
    position[1] = -Math.max(0, (flowerData.stemHeight - 4) * 0.15);
  }

  const plantedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        ...flowerData,
        position, // Use adjusted position
        plantedAt,
        // Let Supabase handle the 'id' generation (assuming it's a UUID PK)
      },
    ])
    .select() // Return the inserted row
    .single(); // Expect a single row back

  if (error) {
    console.error("Error planting flower:", error);
    // Consider more specific error handling (e.g., duplicate checks if needed)
    return null;
  }

  // Ensure position is an array and plantedAt is a string
  return data
    ? {
        ...data,
        position:
          Array.isArray(data.position) && data.position.length === 3
            ? data.position
            : [0, 0, 0],
        plantedAt: data.plantedAt || plantedAt, // Use inserted value or fallback
        lastWatered: data.lastWatered, // Keep as null if it is null
      }
    : null;
};

// Get flowers for a specific user
export const getUserFlowers = async (
  username: string
): Promise<PlantedFlower[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("username", username)
    .order("plantedAt", { ascending: false });

  if (error) {
    console.error("Error fetching user flowers:", error);
    return [];
  }
  // Ensure position is always an array and plantedAt is a string
  return (data || []).map((flower) => ({
    ...flower,
    position:
      Array.isArray(flower.position) && flower.position.length === 3
        ? flower.position
        : [0, 0, 0],
    plantedAt: flower.plantedAt || new Date(0).toISOString(),
    lastWatered: flower.lastWatered,
  }));
};

// Water a flower
export const waterFlower = async (
  flowerId: string
): Promise<PlantedFlower | null> => {
  // First, fetch the current water count
  const { data: currentFlower, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select("waterCount")
    .eq("id", flowerId)
    .single();

  if (fetchError || !currentFlower) {
    console.error(
      "Error fetching flower for watering or flower not found:",
      fetchError
    );
    return null;
  }

  const newWaterCount = (currentFlower.waterCount || 0) + 1;
  const lastWatered = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      lastWatered: lastWatered,
      waterCount: newWaterCount,
    })
    .eq("id", flowerId)
    .select()
    .single();

  if (error) {
    console.error("Error watering flower:", error);
    return null;
  }

  // Ensure position is an array and timestamps are strings
  return data
    ? {
        ...data,
        position:
          Array.isArray(data.position) && data.position.length === 3
            ? data.position
            : [0, 0, 0],
        plantedAt: data.plantedAt || new Date(0).toISOString(),
        lastWatered: data.lastWatered, // Should be the value we just set
      }
    : null;
};

// Remove a flower
export const removeFlower = async (flowerId: string): Promise<boolean> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", flowerId);

  if (error) {
    console.error("Error removing flower:", error);
    return false;
  }

  return true;
};

// Remove client-side initialization logic
// // Check if we're running on the client side
// const isClient = typeof window !== "undefined"
// // Initialize by loading flowers only on the client side
// if (isClient) {
//   loadFlowers()
// }

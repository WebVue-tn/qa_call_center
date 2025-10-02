/**
 * Main seed script to run all seeds
 */

import { seedContactStatuses } from "./contact-statuses";
import { seedDefaultAdmin } from "./default-admin";
import { connectDB } from "~/lib/db";

export async function seedAll() {
  try {
    await connectDB();

    console.log("=".repeat(50));
    console.log("Starting database seeding...");
    console.log("=".repeat(50));
    console.log("");

    // Seed contact statuses first
    await seedContactStatuses();
    console.log("");

    // Seed default admin user
    await seedDefaultAdmin();
    console.log("");

    console.log("=".repeat(50));
    console.log("✓ All seeds completed successfully!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log("Seed process completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed process failed:", error);
      process.exit(1);
    });
}

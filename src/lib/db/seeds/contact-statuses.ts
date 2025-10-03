/**
 * Seed script for default contact statuses
 */

// Load environment variables
import "dotenv/config";

import ContactStatus from "../models/ContactStatus";
import { connectDB } from "~/lib/db";

export const defaultContactStatuses = [
  {
    name: "New",
    code: "new",
    color: "#3B82F6",
    order: 0,
    excludeFromCallList: false,
    isSystemStatus: true,
    isDeletable: false,
  },
  {
    name: "Attempted",
    code: "attempted",
    color: "#F59E0B",
    order: 10,
    excludeFromCallList: false,
    isSystemStatus: false,
    isDeletable: true,
  },
  {
    name: "Callback Requested",
    code: "callback_requested",
    color: "#8B5CF6",
    order: 20,
    excludeFromCallList: false,
    isSystemStatus: false,
    isDeletable: true,
  },
  {
    name: "In Discussion",
    code: "in_discussion",
    color: "#06B6D4",
    order: 30,
    excludeFromCallList: false,
    isSystemStatus: false,
    isDeletable: true,
  },
  {
    name: "Interested",
    code: "interested",
    color: "#10B981",
    order: 40,
    excludeFromCallList: false,
    isSystemStatus: false,
    isDeletable: true,
  },
  {
    name: "Not Interested",
    code: "not_interested",
    color: "#6B7280",
    order: 50,
    excludeFromCallList: true,
    isSystemStatus: false,
    isDeletable: true,
  },
  {
    name: "Converted",
    code: "converted",
    color: "#22C55E",
    order: 100,
    excludeFromCallList: true,
    isSystemStatus: true,
    isDeletable: false,
  },
  {
    name: "Do Not Call",
    code: "do_not_call",
    color: "#EF4444",
    order: 1000,
    excludeFromCallList: true,
    isSystemStatus: false,
    isDeletable: true,
  },
];

export async function seedContactStatuses() {
  await connectDB();

  console.log("Seeding contact statuses...");

  for (const statusData of defaultContactStatuses) {
    const existing = await ContactStatus.findOne({ code: statusData.code });

    if (!existing) {
      await ContactStatus.create(statusData);
      console.log(`✓ Created contact status: ${statusData.name}`);
    } else {
      console.log(`- Contact status already exists: ${statusData.name}`);
    }
  }

  console.log("Contact statuses seeded successfully!");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedContactStatuses()
    .then(() => {
      console.log("Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

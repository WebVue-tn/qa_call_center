/**
 * Seed script for default admin user
 */

import User from "../models/User";
import { connectDB } from "~/lib/db";
import bcrypt from "bcryptjs";

export const defaultAdminData = {
  name: "System Admin",
  email: "admin@vibe-kanban.com",
  password: "admin123", // Change this in production!
  isAdmin: true,
  isAgent: false,
  isTelephoniste: false,
  adminDirectPermissions: ["*"], // All permissions
  adminRoles: [],
  agentDirectPermissions: [],
  agentRoles: [],
};

export async function seedDefaultAdmin() {
  await connectDB();

  console.log("Seeding default admin user...");

  const existing = await User.findOne({ email: defaultAdminData.email });

  if (!existing) {
    // Hash password
    const hashedPassword = await bcrypt.hash(defaultAdminData.password, 10);

    await User.create({
      ...defaultAdminData,
      password: hashedPassword,
    });

    console.log(`✓ Created default admin user: ${defaultAdminData.email}`);
    console.log(`  Password: ${defaultAdminData.password}`);
    console.log(`  ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!`);
  } else {
    console.log(`- Admin user already exists: ${defaultAdminData.email}`);
  }

  console.log("Default admin user seeded successfully!");
}

// Run if executed directly
if (require.main === module) {
  seedDefaultAdmin()
    .then(() => {
      console.log("Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

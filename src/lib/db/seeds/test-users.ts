/**
 * Seed script for test telephoniste and agent users
 */

import "dotenv/config";
import User from "../models/User";
import { connectDB } from "~/lib/db";
import bcrypt from "bcryptjs";

const testUsers = [
  // Telephonistes
  {
    name: "Marie Dubois",
    email: "marie.dubois@vibe-kanban.com",
    password: "test123",
    isTelephoniste: true,
    isAdmin: false,
    isAgent: false,
    adminDirectPermissions: [],
    adminRoles: [],
    agentDirectPermissions: [],
    agentRoles: [],
  },
  {
    name: "Jean Tremblay",
    email: "jean.tremblay@vibe-kanban.com",
    password: "test123",
    isTelephoniste: true,
    isAdmin: false,
    isAgent: false,
    adminDirectPermissions: [],
    adminRoles: [],
    agentDirectPermissions: [],
    agentRoles: [],
  },
  {
    name: "Sophie Gagnon",
    email: "sophie.gagnon@vibe-kanban.com",
    password: "test123",
    isTelephoniste: true,
    isAdmin: false,
    isAgent: false,
    adminDirectPermissions: [],
    adminRoles: [],
    agentDirectPermissions: [],
    agentRoles: [],
  },
  // Agents
  {
    name: "Pierre Levesque",
    email: "pierre.levesque@vibe-kanban.com",
    password: "test123",
    isTelephoniste: false,
    isAdmin: false,
    isAgent: true,
    adminDirectPermissions: [],
    adminRoles: [],
    agentDirectPermissions: [],
    agentRoles: [],
  },
  {
    name: "Isabelle Roy",
    email: "isabelle.roy@vibe-kanban.com",
    password: "test123",
    isTelephoniste: false,
    isAdmin: false,
    isAgent: true,
    adminDirectPermissions: [],
    adminRoles: [],
    agentDirectPermissions: [],
    agentRoles: [],
  },
  {
    name: "Marc Bergeron",
    email: "marc.bergeron@vibe-kanban.com",
    password: "test123",
    isTelephoniste: false,
    isAdmin: false,
    isAgent: true,
    adminDirectPermissions: [],
    adminRoles: [],
    agentDirectPermissions: [],
    agentRoles: [],
  },
  // Multi-role user (Admin + Telephoniste)
  {
    name: "Admin Telephoniste",
    email: "admin.tel@vibe-kanban.com",
    password: "test123",
    isTelephoniste: true,
    isAdmin: true,
    isAgent: false,
    adminDirectPermissions: ["*"],
    adminRoles: [],
    agentDirectPermissions: [],
    agentRoles: [],
  },
];

export async function seedTestUsers() {
  await connectDB();

  console.log("Seeding test users...");

  for (const userData of testUsers) {
    const existing = await User.findOne({ email: userData.email });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      await User.create({
        ...userData,
        password: hashedPassword,
      });

      console.log(`✓ Created user: ${userData.name} (${userData.email})`);
    } else {
      console.log(`- User already exists: ${userData.email}`);
    }
  }

  console.log("Test users seeded successfully!");
  console.log("\nDefault password for all test users: test123");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestUsers()
    .then(() => {
      console.log("Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

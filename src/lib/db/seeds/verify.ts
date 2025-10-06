import "dotenv/config";
import { connectDB } from "~/lib/db";
import User from "../models/User";
import Contact from "../models/Contact";
import ContactStatus from "../models/ContactStatus";

async function verify() {
  await connectDB();

  const users = await User.countDocuments();
  const telephonistes = await User.countDocuments({ isTelephoniste: true });
  const agents = await User.countDocuments({ isAgent: true });
  const admins = await User.countDocuments({ isAdmin: true });
  const contacts = await Contact.countDocuments();
  const statuses = await ContactStatus.countDocuments();

  // Get status breakdown
  const statusCounts = await Contact.aggregate([
    {
      $group: {
        _id: "$statusId",
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "contactstatuses",
        localField: "_id",
        foreignField: "_id",
        as: "status",
      },
    },
  ]);

  console.log("=".repeat(50));
  console.log("DATABASE SUMMARY");
  console.log("=".repeat(50));
  console.log("");
  console.log("Users:");
  console.log(`  Total Users: ${users}`);
  console.log(`  - Admins: ${admins}`);
  console.log(`  - Telephonistes: ${telephonistes}`);
  console.log(`  - Agents: ${agents}`);
  console.log("");
  console.log("Contacts:");
  console.log(`  Total Contacts: ${contacts}`);
  console.log(`  Contact Statuses Defined: ${statuses}`);
  console.log("");
  console.log("Contact Status Breakdown:");
  for (const item of statusCounts) {
    const statusName = item.status[0]?.name || "Unknown";
    console.log(`  - ${statusName}: ${item.count}`);
  }
  console.log("");
  console.log("=".repeat(50));
  console.log("Test Credentials:");
  console.log("=".repeat(50));
  console.log("Admin: admin@vibe-kanban.com / admin123");
  console.log("Admin+Tel: admin.tel@vibe-kanban.com / test123");
  console.log("Telephoniste: marie.dubois@vibe-kanban.com / test123");
  console.log("Agent: pierre.levesque@vibe-kanban.com / test123");
  console.log("=".repeat(50));

  process.exit(0);
}

verify().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});

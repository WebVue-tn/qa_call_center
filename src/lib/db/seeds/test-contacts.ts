/**
 * Seed script for test contacts
 */

import "dotenv/config";
import Contact from "../models/Contact";
import ContactStatus from "../models/ContactStatus";
import User from "../models/User";
import { connectDB } from "~/lib/db";

// Sample Canadian names
const firstNames = [
  "Alexandre", "Amélie", "Antoine", "Catherine", "Charles", "Émilie",
  "François", "Gabriel", "Isabelle", "Jacques", "Julie", "Laurent",
  "Marie", "Nicolas", "Olivier", "Patricia", "Philippe", "Sarah",
  "Thomas", "Valérie", "Vincent", "Véronique", "Yves", "Zoé"
];

const lastNames = [
  "Bergeron", "Bouchard", "Côté", "Dubois", "Fortin", "Gagnon",
  "Gauthier", "Girard", "Lachance", "Lavoie", "Leblanc", "Legault",
  "Lemieux", "Lessard", "Levesque", "Morin", "Nadeau", "Ouellet",
  "Pelletier", "Poirier", "Richard", "Roy", "Simard", "Tremblay"
];

// Sample Montreal area codes
const areaCodes = ["514", "438", "450"];

// Sample Montreal postal codes (first 3 characters)
const postalCodePrefixes = [
  "H1A", "H1B", "H1C", "H2A", "H2B", "H2C", "H3A", "H3B", "H3C",
  "H4A", "H4B", "H4C", "J4G", "J4H", "J4J", "J4K", "J4L"
];

const streets = [
  "Rue Sainte-Catherine", "Boulevard René-Lévesque", "Rue Saint-Denis",
  "Avenue du Mont-Royal", "Rue Sherbrooke", "Boulevard Saint-Laurent",
  "Rue Ontario", "Avenue du Parc", "Rue Beaubien", "Boulevard Henri-Bourassa"
];

function generatePhone(): string {
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const exchange = Math.floor(Math.random() * 900) + 100;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;
  return `${areaCode}${exchange}${lineNumber}`;
}

function generatePostalCode(): string {
  const prefix = postalCodePrefixes[Math.floor(Math.random() * postalCodePrefixes.length)];
  const digit = Math.floor(Math.random() * 10);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const lastDigit = Math.floor(Math.random() * 10);
  return `${prefix} ${digit}${letter}${lastDigit}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domain = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.ca"][Math.floor(Math.random() * 4)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generateAddress(): string {
  const number = Math.floor(Math.random() * 9000) + 1000;
  const street = streets[Math.floor(Math.random() * streets.length)];
  return `${number} ${street}`;
}

export async function seedTestContacts() {
  await connectDB();

  console.log("Seeding test contacts...");

  // Get contact statuses
  const statuses = await ContactStatus.find();
  if (statuses.length === 0) {
    console.error("❌ No contact statuses found! Please run contact-statuses seed first.");
    return;
  }

  // Get telephonistes
  const telephonistes = await User.find({ isTelephoniste: true });
  if (telephonistes.length === 0) {
    console.warn("⚠️  No telephonistes found. Contacts will be created unassigned.");
  }

  const statusMap = {
    new: statuses.find(s => s.code === "new")?._id,
    attempted: statuses.find(s => s.code === "attempted")?._id,
    callback_requested: statuses.find(s => s.code === "callback_requested")?._id,
    in_discussion: statuses.find(s => s.code === "in_discussion")?._id,
    interested: statuses.find(s => s.code === "interested")?._id,
    not_interested: statuses.find(s => s.code === "not_interested")?._id,
  };

  let created = 0;

  // Create 100 test contacts with various statuses
  for (let i = 0; i < 100; i++) {
    const phone = generatePhone();

    // Check if contact already exists
    const existing = await Contact.findOne({ phone });
    if (existing) {
      continue;
    }

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]!;
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]!;
    const name = `${firstName} ${lastName}`;

    // Randomly determine if contact has full info (70% chance)
    const hasFullInfo = Math.random() > 0.3;

    // Distribute contacts across statuses
    let statusId;
    const rand = Math.random();
    if (rand < 0.4) {
      statusId = statusMap.new; // 40% new
    } else if (rand < 0.6) {
      statusId = statusMap.attempted; // 20% attempted
    } else if (rand < 0.75) {
      statusId = statusMap.callback_requested; // 15% callback requested
    } else if (rand < 0.85) {
      statusId = statusMap.in_discussion; // 10% in discussion
    } else if (rand < 0.92) {
      statusId = statusMap.interested; // 7% interested
    } else {
      statusId = statusMap.not_interested; // 8% not interested
    }

    // Randomly assign to telephoniste (80% assigned)
    const assignedToTelephonisteId =
      telephonistes.length > 0 && Math.random() > 0.2
        ? telephonistes[Math.floor(Math.random() * telephonistes.length)]!._id
        : undefined;

    const contactData: any = {
      phone,
      name,
      statusId,
      assignedToTelephonisteId,
      statusHistory: [
        {
          statusId: statusMap.new,
          updatedBy: assignedToTelephonisteId || telephonistes[0]?._id,
          updatedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        },
      ],
      notes: [],
      callHistory: [],
      assignmentHistory: [],
      isConverted: false,
    };

    if (hasFullInfo) {
      contactData.email = generateEmail(firstName, lastName);
      contactData.address = generateAddress();
      contactData.postalCode = generatePostalCode();
      contactData.city = "Montréal";
    }

    // Add some call history for non-new contacts
    if (statusId !== statusMap.new && assignedToTelephonisteId) {
      const callCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < callCount; j++) {
        contactData.callHistory.push({
          callSid: `test_call_${Date.now()}_${j}`,
          direction: "outbound",
          duration: Math.floor(Math.random() * 300) + 30,
          status: "completed",
          calledBy: assignedToTelephonisteId,
          calledAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Add some notes for contacts that have been called
    if (contactData.callHistory.length > 0) {
      const noteCount = Math.floor(Math.random() * 2) + 1;
      const sampleNotes = [
        "Interested in learning more about the service",
        "Requested callback next week",
        "Not available, try again later",
        "Wants to discuss with spouse first",
        "Very interested, ready to book",
        "Asked about pricing details",
        "Not interested at this time",
        "Left voicemail",
      ];

      for (let j = 0; j < noteCount; j++) {
        contactData.notes.push({
          content: sampleNotes[Math.floor(Math.random() * sampleNotes.length)],
          createdBy: assignedToTelephonisteId,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Add assignment history if assigned
    if (assignedToTelephonisteId) {
      contactData.assignmentHistory.push({
        action: "assigned",
        toUserId: assignedToTelephonisteId,
        assignedBy: telephonistes[0]?._id,
        assignedAt: new Date(Date.now() - Math.floor(Math.random() * 25) * 24 * 60 * 60 * 1000),
      });
    }

    await Contact.create(contactData);
    created++;

    if (created % 20 === 0) {
      console.log(`  Created ${created} contacts...`);
    }
  }

  console.log(`✓ Created ${created} test contacts`);
  console.log("Test contacts seeded successfully!");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestContacts()
    .then(() => {
      console.log("Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

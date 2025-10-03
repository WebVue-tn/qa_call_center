import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import ContactStatus from "~/lib/db/models/ContactStatus";

/**
 * GET /api/contact-statuses
 * Get all contact statuses
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const statuses = await ContactStatus.find().sort({ order: 1 }).lean();

    return NextResponse.json(statuses);
  } catch (error) {
    console.error("Error fetching contact statuses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import User from "~/lib/db/models/User";

/**
 * GET /api/telephonistes
 * Get all users who are telephonistes
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const telephonistes = await User.find({ isTelephoniste: true })
      .select("name email")
      .lean();

    return NextResponse.json(telephonistes);
  } catch (error) {
    console.error("Error fetching telephonistes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import { getRecentChanges } from "~/lib/utils/history-query-utils";
import Contact from "~/lib/db/models/Contact";
import Reservation from "~/lib/db/models/Reservation";
import ContactStatus from "~/lib/db/models/ContactStatus";
import User from "~/lib/db/models/User";

/**
 * GET /api/history/recent
 * Get recent changes across all collections
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;
    const action = searchParams.get("action") as
      | "create"
      | "update"
      | "delete"
      | undefined;
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;

    // Collect recent changes from multiple collections
    const collections = [
      { name: "contacts", model: Contact },
      { name: "reservations", model: Reservation },
      { name: "contact_statuses", model: ContactStatus },
      { name: "users", model: User },
    ];

    const allChanges: Array<{
      collection: string;
      documentId: string;
      entry: any;
    }> = [];

    for (const { name, model } of collections) {
      const changes = await getRecentChanges(model, {
        limit: limit * 2, // Get more than needed, we'll sort and limit later
        action,
        dateFrom,
      });

      changes.forEach((change) => {
        allChanges.push({
          collection: name,
          documentId: change.documentId,
          entry: change.entry,
        });
      });
    }

    // Sort all changes by timestamp descending
    allChanges.sort(
      (a, b) => b.entry.timestamp.getTime() - a.entry.timestamp.getTime()
    );

    // Limit results
    const limitedChanges = allChanges.slice(0, limit);

    return NextResponse.json({
      changes: limitedChanges,
      total: limitedChanges.length,
      limit,
    });
  } catch (error) {
    console.error("Error fetching recent changes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

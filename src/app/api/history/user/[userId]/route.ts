import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import { getUserActivityInCollection } from "~/lib/utils/history-query-utils";
import Contact from "~/lib/db/models/Contact";
import Reservation from "~/lib/db/models/Reservation";
import ContactStatus from "~/lib/db/models/ContactStatus";
import User from "~/lib/db/models/User";

/**
 * GET /api/history/user/[userId]
 * Get all activity by a specific user across collections
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { userId } = params;
    const { searchParams } = new URL(request.url);

    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;

    // Collect activity from multiple collections
    const collections = [
      { name: "contacts", model: Contact },
      { name: "reservations", model: Reservation },
      { name: "contact_statuses", model: ContactStatus },
      { name: "users", model: User },
    ];

    const allActivity: Array<{
      collection: string;
      documentId: string;
      history: any[];
    }> = [];

    for (const { name, model } of collections) {
      const activity = await getUserActivityInCollection(model, userId, {
        dateFrom,
        dateTo,
        limit: 1000, // Get all, we'll sort and paginate later
      });

      activity.forEach((item) => {
        allActivity.push({
          collection: name,
          documentId: item.documentId,
          history: item.history,
        });
      });
    }

    // Flatten all history entries with metadata
    const flattenedActivity = allActivity.flatMap((item) =>
      item.history.map((entry) => ({
        collection: item.collection,
        documentId: item.documentId,
        ...entry,
      }))
    );

    // Sort by timestamp descending
    flattenedActivity.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    // Paginate
    const paginatedActivity = flattenedActivity.slice(offset, offset + limit);

    return NextResponse.json({
      userId,
      activity: paginatedActivity,
      total: flattenedActivity.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

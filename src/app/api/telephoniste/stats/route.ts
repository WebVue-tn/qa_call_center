import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";

/**
 * GET /api/telephoniste/stats
 * Get performance stats for the current telephoniste
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !session.user.isTelephoniste) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Date range (default to this month)
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : new Date();

    // Get all contacts assigned to this telephoniste
    const assignedContacts = await Contact.find({
      assignedToTelephonisteId: userId,
    }).lean();

    // Calculate stats
    const stats = {
      totalAssigned: assignedContacts.length,
      totalCalls: 0,
      totalConversions: 0,
      conversionRate: 0,
      callsInPeriod: 0,
      conversionsInPeriod: 0,
      statusBreakdown: {} as Record<string, number>,
    };

    assignedContacts.forEach((contact) => {
      // Total calls ever made
      const userCalls = contact.callHistory.filter(
        (call) => call.calledBy?.toString() === userId
      );
      stats.totalCalls += userCalls.length;

      // Calls in date range
      const periodCalls = userCalls.filter(
        (call) =>
          new Date(call.calledAt) >= dateFrom &&
          new Date(call.calledAt) <= dateTo
      );
      stats.callsInPeriod += periodCalls.length;

      // Conversions
      if (
        contact.isConverted &&
        contact.convertedBy?.toString() === userId
      ) {
        stats.totalConversions++;

        if (
          contact.convertedAt &&
          new Date(contact.convertedAt) >= dateFrom &&
          new Date(contact.convertedAt) <= dateTo
        ) {
          stats.conversionsInPeriod++;
        }
      }

      // Status breakdown
      const statusId = contact.statusId.toString();
      stats.statusBreakdown[statusId] =
        (stats.statusBreakdown[statusId] || 0) + 1;
    });

    // Calculate conversion rate
    if (stats.totalAssigned > 0) {
      stats.conversionRate =
        (stats.totalConversions / stats.totalAssigned) * 100;
    }

    return NextResponse.json({
      stats,
      dateRange: {
        from: dateFrom,
        to: dateTo,
      },
    });
  } catch (error) {
    console.error("Error fetching telephoniste stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

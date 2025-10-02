import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";
import User from "~/lib/db/models/User";
import { hasAdminPermission } from "~/lib/utils/permission-utils";

/**
 * GET /api/admin/telephoniste-stats
 * Get performance stats for all telephonistes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permission (skip permission check for now, just verify isAdmin)
    if (!session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    // Date range (default to this month)
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : new Date();

    // Get all telephonistes
    const telephonistes = await User.find({ isTelephoniste: true }).select(
      "name email"
    );

    const stats = [];

    for (const telephoniste of telephonistes) {
      const userId = (telephoniste._id as any).toString();

      // Get all contacts assigned to this telephoniste
      const assignedContacts = await Contact.find({
        assignedToTelephonisteId: userId,
      }).lean();

      const userStats = {
        userId,
        userName: telephoniste.name,
        userEmail: telephoniste.email,
        totalAssigned: assignedContacts.length,
        totalCalls: 0,
        totalConversions: 0,
        conversionRate: 0,
        callsInPeriod: 0,
        conversionsInPeriod: 0,
        statusBreakdown: {} as Record<string, number>,
      };

      assignedContacts.forEach((contact) => {
        // Total calls ever made by this telephoniste
        const userCalls = contact.callHistory.filter(
          (call) => call.calledBy?.toString() === userId
        );
        userStats.totalCalls += userCalls.length;

        // Calls in date range
        const periodCalls = userCalls.filter(
          (call) =>
            new Date(call.calledAt) >= dateFrom &&
            new Date(call.calledAt) <= dateTo
        );
        userStats.callsInPeriod += periodCalls.length;

        // Conversions
        if (
          contact.isConverted &&
          contact.convertedBy?.toString() === userId
        ) {
          userStats.totalConversions++;

          if (
            contact.convertedAt &&
            new Date(contact.convertedAt) >= dateFrom &&
            new Date(contact.convertedAt) <= dateTo
          ) {
            userStats.conversionsInPeriod++;
          }
        }

        // Status breakdown
        const statusId = contact.statusId.toString();
        userStats.statusBreakdown[statusId] =
          (userStats.statusBreakdown[statusId] || 0) + 1;
      });

      // Calculate conversion rate
      if (userStats.totalAssigned > 0) {
        userStats.conversionRate =
          (userStats.totalConversions / userStats.totalAssigned) * 100;
      }

      stats.push(userStats);
    }

    // Sort by total conversions descending
    stats.sort((a, b) => b.totalConversions - a.totalConversions);

    return NextResponse.json({
      stats,
      dateRange: {
        from: dateFrom,
        to: dateTo,
      },
      totalTelephonistes: telephonistes.length,
    });
  } catch (error) {
    console.error("Error fetching telephoniste stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";
import ContactStatus from "~/lib/db/models/ContactStatus";
import { hasAdminPermission } from "~/lib/utils/permission-utils";

/**
 * GET /api/admin/contact-stats
 * Get contact analytics for admins
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

    // Get all contacts
    const allContacts = await Contact.find({}).lean();

    // Get contacts created in period
    const contactsInPeriod = await Contact.find({
      createdAt: { $gte: dateFrom, $lte: dateTo },
    }).lean();

    // Get all statuses
    const statuses = await ContactStatus.find({}).lean();

    // Calculate stats
    const stats = {
      total: allContacts.length,
      createdInPeriod: contactsInPeriod.length,
      assigned: 0,
      unassigned: 0,
      converted: 0,
      convertedInPeriod: 0,
      conversionRate: 0,
      totalCalls: 0,
      callsInPeriod: 0,
      statusBreakdown: {} as Record<
        string,
        { count: number; name: string; color: string }
      >,
    };

    // Initialize status breakdown
    statuses.forEach((status) => {
      stats.statusBreakdown[status._id.toString()] = {
        count: 0,
        name: status.name,
        color: status.color,
      };
    });

    allContacts.forEach((contact) => {
      // Assignment stats
      if (contact.assignedToTelephonisteId) {
        stats.assigned++;
      } else {
        stats.unassigned++;
      }

      // Conversion stats
      if (contact.isConverted) {
        stats.converted++;

        if (
          contact.convertedAt &&
          new Date(contact.convertedAt) >= dateFrom &&
          new Date(contact.convertedAt) <= dateTo
        ) {
          stats.convertedInPeriod++;
        }
      }

      // Call stats
      stats.totalCalls += contact.callHistory.length;

      const periodCalls = contact.callHistory.filter(
        (call) =>
          new Date(call.calledAt) >= dateFrom &&
          new Date(call.calledAt) <= dateTo
      );
      stats.callsInPeriod += periodCalls.length;

      // Status breakdown
      const statusId = contact.statusId.toString();
      if (stats.statusBreakdown[statusId]) {
        stats.statusBreakdown[statusId].count++;
      }
    });

    // Calculate conversion rate
    if (stats.total > 0) {
      stats.conversionRate = (stats.converted / stats.total) * 100;
    }

    return NextResponse.json({
      stats,
      dateRange: {
        from: dateFrom,
        to: dateTo,
      },
    });
  } catch (error) {
    console.error("Error fetching contact stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

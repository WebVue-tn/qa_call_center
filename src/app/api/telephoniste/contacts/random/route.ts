import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";
import ContactStatus from "~/lib/db/models/ContactStatus";

/**
 * GET /api/telephoniste/contacts/random
 * Get next contact for telephoniste with smart prioritization
 *
 * Priority algorithm:
 * 1. Status order (lower = higher priority)
 * 2. Uncalled contacts first (callHistory.length === 0)
 * 3. Exclude contacts worked today by this user
 * 4. Exclude statuses with excludeFromCallList = true
 * 5. Random within each priority group
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !session.user.isTelephoniste) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get statuses to exclude from call list
    const excludedStatuses = await ContactStatus.find({
      excludeFromCallList: true,
    }).select("_id");

    const excludedStatusIds = excludedStatuses.map((s) => s._id);

    // Get contacts worked today by this user
    const workedTodayContacts = await Contact.find({
      $or: [
        {
          "callHistory.calledBy": userId,
          "callHistory.calledAt": { $gte: today },
        },
        {
          "statusHistory.updatedBy": userId,
          "statusHistory.updatedAt": { $gte: today },
        },
      ],
    }).select("_id");

    const workedTodayIds = workedTodayContacts.map((c) => c._id);

    // Build query for eligible contacts
    const query: any = {
      // Assigned to this telephoniste
      assignedToTelephonisteId: userId,

      // Not excluded statuses
      statusId: { $nin: excludedStatusIds },

      // Not worked today
      _id: { $nin: workedTodayIds },
    };

    // Get all eligible contacts with status info
    const eligibleContacts = await Contact.find(query)
      .populate("statusId")
      .lean();

    if (eligibleContacts.length === 0) {
      return NextResponse.json(
        { message: "No contacts available" },
        { status: 404 }
      );
    }

    // Sort by priority
    eligibleContacts.sort((a, b) => {
      // Priority 1: Status order (lower is higher priority)
      const statusOrderA = (a.statusId as any).order || 999;
      const statusOrderB = (b.statusId as any).order || 999;

      if (statusOrderA !== statusOrderB) {
        return statusOrderA - statusOrderB;
      }

      // Priority 2: Uncalled first
      const hasCallsA = a.callHistory.length > 0 ? 1 : 0;
      const hasCallsB = b.callHistory.length > 0 ? 1 : 0;

      if (hasCallsA !== hasCallsB) {
        return hasCallsA - hasCallsB;
      }

      // Priority 3: Random
      return Math.random() - 0.5;
    });

    // Return the first (highest priority) contact
    const selectedContact = eligibleContacts[0];

    if (!selectedContact) {
      return NextResponse.json(
        { message: "No contacts available" },
        { status: 404 }
      );
    }

    // Populate additional fields
    const contact = await Contact.findById(selectedContact._id)
      .populate("statusId")
      .populate("assignedToTelephonisteId", "name email")
      .populate("notes.createdBy", "name email")
      .populate("statusHistory.updatedBy", "name email")
      .lean();

    return NextResponse.json({
      contact,
      totalAvailable: eligibleContacts.length,
    });
  } catch (error) {
    console.error("Error fetching random contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

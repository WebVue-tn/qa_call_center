import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";

/**
 * GET /api/telephoniste/contacts/activity-history
 * Get today's activity for the current telephoniste
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

    // Find all contacts worked today
    const workedContacts = await Contact.find({
      $or: [
        {
          "callHistory.calledBy": userId,
          "callHistory.calledAt": { $gte: today },
        },
        {
          "statusHistory.updatedBy": userId,
          "statusHistory.updatedAt": { $gte: today },
        },
        {
          "notes.createdBy": userId,
          "notes.createdAt": { $gte: today },
        },
      ],
    })
      .populate("statusId")
      .populate("assignedToTelephonisteId", "name email")
      .sort({ updatedAt: -1 })
      .lean();

    // Calculate stats
    const stats = {
      contactsWorked: workedContacts.length,
      callsMade: 0,
      conversions: 0,
      notesAdded: 0,
    };

    workedContacts.forEach((contact) => {
      // Count calls made today
      const todayCalls = contact.callHistory.filter(
        (call) =>
          call.calledBy?.toString() === userId &&
          new Date(call.calledAt) >= today
      );
      stats.callsMade += todayCalls.length;

      // Count conversions today
      if (
        contact.isConverted &&
        contact.convertedBy?.toString() === userId &&
        contact.convertedAt &&
        new Date(contact.convertedAt) >= today
      ) {
        stats.conversions++;
      }

      // Count notes added today
      const todayNotes = contact.notes.filter(
        (note) =>
          note.createdBy.toString() === userId &&
          new Date(note.createdAt) >= today
      );
      stats.notesAdded += todayNotes.length;
    });

    return NextResponse.json({
      stats,
      contacts: workedContacts,
    });
  } catch (error) {
    console.error("Error fetching activity history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

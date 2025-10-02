import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";
import Reservation from "~/lib/db/models/Reservation";
import ContactStatus from "~/lib/db/models/ContactStatus";
import AgentProfile from "~/lib/db/models/AgentProfile";
import { createHistoryContext } from "~/lib/utils/history-utils";

/**
 * POST /api/contacts/[id]/convert
 * Convert a contact to a reservation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const contact = await Contact.findById(params.id);

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    if (contact.isConverted) {
      return NextResponse.json(
        { error: "Contact is already converted" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.date) {
      return NextResponse.json(
        { error: "Reservation date is required" },
        { status: 400 }
      );
    }

    if (!body.assignedToAgentId) {
      return NextResponse.json(
        { error: "Assigned agent ID is required" },
        { status: 400 }
      );
    }

    // Verify agent profile exists
    const agentProfile = await AgentProfile.findOne({
      userId: body.assignedToAgentId,
    });

    if (!agentProfile) {
      return NextResponse.json(
        { error: "Agent profile not found" },
        { status: 400 }
      );
    }

    // TODO: Check agent availability and conflicts
    // This would involve checking the agent's availability slots
    // and ensuring no conflicting reservations exist

    // Create history context
    const historyCtx = createHistoryContext(session);
    if (!historyCtx) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Create reservation
    const reservation = await historyCtx.create(Reservation, {
      contactId: contact._id,
      date: new Date(body.date),
      assignedToAgentId: body.assignedToAgentId,
      status: "scheduled",
      customerInfo: {
        name: contact.name || "Unknown",
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        postalCode: contact.postalCode,
        city: contact.city,
      },
      notes: body.notes
        ? [
            {
              content: body.notes,
              createdBy: session.user.id,
              createdAt: new Date(),
            },
          ]
        : [],
    });

    // Get "converted" status
    const convertedStatus = await ContactStatus.findOne({ code: "converted" });
    if (!convertedStatus) {
      return NextResponse.json(
        { error: "Converted status not found" },
        { status: 500 }
      );
    }

    // Update contact status to converted
    contact.statusHistory.push({
      statusId: convertedStatus._id as any,
      updatedBy: session.user.id as any,
      updatedAt: new Date(),
      note: "Converted to reservation",
    });

    // Update contact with conversion info
    await historyCtx.update(contact, {
      isConverted: true,
      convertedBy: session.user.id,
      convertedAt: new Date(),
      reservationId: reservation._id as any,
      statusId: convertedStatus._id,
      statusHistory: contact.statusHistory,
    });

    // Populate and return both
    await reservation.populate("assignedToAgentId", "name email");
    await contact.populate("statusId");
    await contact.populate("reservationId");

    return NextResponse.json({
      contact,
      reservation,
    });
  } catch (error) {
    console.error("Error converting contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

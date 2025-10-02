import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";
import ContactStatus from "~/lib/db/models/ContactStatus";
import { createHistoryContext } from "~/lib/utils/history-utils";

/**
 * PATCH /api/contacts/[id]/status
 * Update contact status
 */
export async function PATCH(
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

    const body = await request.json();

    if (!body.statusId) {
      return NextResponse.json(
        { error: "Status ID is required" },
        { status: 400 }
      );
    }

    // Verify status exists
    const status = await ContactStatus.findById(body.statusId);
    if (!status) {
      return NextResponse.json(
        { error: "Invalid status ID" },
        { status: 400 }
      );
    }

    // Create history context
    const historyCtx = createHistoryContext(session);
    if (!historyCtx) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Add to status history
    contact.statusHistory.push({
      statusId: body.statusId,
      updatedBy: session.user.id as any,
      updatedAt: new Date(),
      note: body.note,
    });

    // Update contact with history tracking
    await historyCtx.update(contact, {
      statusId: body.statusId,
      statusHistory: contact.statusHistory,
    });

    // Populate and return
    await contact.populate("statusId");

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

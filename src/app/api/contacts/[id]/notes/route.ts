import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";
import { createHistoryContext } from "~/lib/utils/history-utils";

/**
 * POST /api/contacts/[id]/notes
 * Add a note to a contact
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

    const body = await request.json();

    if (!body.content) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    // Create history context
    const historyCtx = createHistoryContext(session);
    if (!historyCtx) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Add note
    contact.notes.push({
      content: body.content,
      createdBy: session.user.id as any,
      createdAt: new Date(),
    });

    // Update contact with history tracking
    await historyCtx.update(contact, {
      notes: contact.notes,
    });

    // Populate and return
    await contact.populate("notes.createdBy", "name email");

    return NextResponse.json({
      note: contact.notes[contact.notes.length - 1],
    });
  } catch (error) {
    console.error("Error adding note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";
import { createHistoryContext } from "~/lib/utils/history-utils";

/**
 * POST /api/contacts/[id]/call-log
 * Log a call for a contact
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

    if (!body.callSid || !body.status) {
      return NextResponse.json(
        { error: "Call SID and status are required" },
        { status: 400 }
      );
    }

    // Create history context
    const historyCtx = createHistoryContext(session);
    if (!historyCtx) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Add call to history
    contact.callHistory.push({
      callSid: body.callSid,
      direction: body.direction || "outbound",
      duration: body.duration,
      status: body.status,
      calledBy: session.user.id as any,
      calledAt: new Date(),
    });

    // Update contact with history tracking
    await historyCtx.update(contact, {
      callHistory: contact.callHistory,
    });

    return NextResponse.json({
      callLog: contact.callHistory[contact.callHistory.length - 1],
    });
  } catch (error) {
    console.error("Error logging call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

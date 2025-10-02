import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";
import User from "~/lib/db/models/User";
import { createHistoryContext } from "~/lib/utils/history-utils";

/**
 * POST /api/contacts/assign
 * Bulk assign contacts to a telephoniste
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    if (!body.contactIds || !Array.isArray(body.contactIds)) {
      return NextResponse.json(
        { error: "Contact IDs array is required" },
        { status: 400 }
      );
    }

    if (!body.telephonisteId) {
      return NextResponse.json(
        { error: "Telephoniste ID is required" },
        { status: 400 }
      );
    }

    // Verify telephoniste exists and is a telephoniste
    const telephoniste = await User.findById(body.telephonisteId);
    if (!telephoniste || !telephoniste.isTelephoniste) {
      return NextResponse.json(
        { error: "Invalid telephoniste ID" },
        { status: 400 }
      );
    }

    // Create history context
    const historyCtx = createHistoryContext(session);
    if (!historyCtx) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const results = {
      assigned: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each contact
    for (const contactId of body.contactIds) {
      try {
        const contact = await Contact.findById(contactId);

        if (!contact) {
          results.failed++;
          results.errors.push(`Contact ${contactId} not found`);
          continue;
        }

        // Add to assignment history
        const assignmentEntry = {
          action: contact.assignedToTelephonisteId ? "moved" : "assigned",
          fromUserId: contact.assignedToTelephonisteId,
          toUserId: body.telephonisteId,
          assignedBy: session.user.id as any,
          assignedAt: new Date(),
        };

        contact.assignmentHistory.push(assignmentEntry as any);

        // Update assignment with history tracking
        await historyCtx.update(contact, {
          assignedToTelephonisteId: body.telephonisteId,
          assignmentHistory: contact.assignmentHistory,
        });

        results.assigned++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to assign contact ${contactId}: ${error}`
        );
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error assigning contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

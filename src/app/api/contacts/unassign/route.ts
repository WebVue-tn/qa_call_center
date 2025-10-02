import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";
import { createHistoryContext } from "~/lib/utils/history-utils";

/**
 * POST /api/contacts/unassign
 * Bulk unassign contacts from telephonistes
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

    // Create history context
    const historyCtx = createHistoryContext(session);
    if (!historyCtx) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const results = {
      unassigned: 0,
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

        if (!contact.assignedToTelephonisteId) {
          results.failed++;
          results.errors.push(`Contact ${contactId} is not assigned`);
          continue;
        }

        // Add to assignment history
        contact.assignmentHistory.push({
          action: "unassigned",
          fromUserId: contact.assignedToTelephonisteId,
          assignedBy: session.user.id as any,
          assignedAt: new Date(),
        } as any);

        // Update assignment with history tracking
        await historyCtx.update(contact, {
          assignedToTelephonisteId: undefined,
          assignmentHistory: contact.assignmentHistory,
        });

        results.unassigned++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to unassign contact ${contactId}: ${error}`
        );
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error unassigning contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

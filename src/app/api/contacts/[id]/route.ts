import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";
import { createHistoryContext } from "~/lib/utils/history-utils";
import {
  normalizePostalCode,
  isValidPostalCode,
} from "~/lib/utils/postal-code-utils";

/**
 * GET /api/contacts/[id]
 * Get a single contact by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const contact = await Contact.findById(params.id)
      .populate("statusId")
      .populate("assignedToTelephonisteId", "name email")
      .populate("convertedBy", "name email")
      .populate("reservationId")
      .populate("notes.createdBy", "name email")
      .populate("statusHistory.updatedBy", "name email")
      .lean();

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[id]
 * Update a contact
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

    // Validate postal code if provided
    if (body.postalCode) {
      if (!isValidPostalCode(body.postalCode)) {
        return NextResponse.json(
          { error: "Invalid Canadian postal code" },
          { status: 400 }
        );
      }
      body.postalCode = normalizePostalCode(body.postalCode);
    }

    // Don't allow updating phone, statusId, or conversion fields directly
    delete body.phone;
    delete body.statusId;
    delete body.isConverted;
    delete body.convertedBy;
    delete body.convertedAt;
    delete body.reservationId;
    delete body.statusHistory;
    delete body.assignmentHistory;
    delete body.callHistory;
    delete body.notes;
    delete body.history;

    // Create history context
    const historyCtx = createHistoryContext(session);
    if (!historyCtx) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Update contact with history tracking
    await historyCtx.update(contact, body);

    // Populate and return
    await contact.populate("statusId");
    await contact.populate("assignedToTelephonisteId", "name email");

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id]
 * Delete a contact
 */
export async function DELETE(
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

    // Create history context
    const historyCtx = createHistoryContext(session);
    if (!historyCtx) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Delete with history tracking
    await historyCtx.delete(contact);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

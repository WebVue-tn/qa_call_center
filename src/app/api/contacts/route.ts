import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import Contact from "~/lib/db/models/Contact";
import ContactStatus from "~/lib/db/models/ContactStatus";
import { createHistoryContext } from "~/lib/utils/history-utils";
import { normalizePhone, isValidPhone } from "~/lib/utils/phone-utils";
import {
  normalizePostalCode,
  isValidPostalCode,
} from "~/lib/utils/postal-code-utils";

/**
 * GET /api/contacts
 * List contacts with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Filters
    const statusId = searchParams.get("statusId");
    const assignedToTelephonisteId = searchParams.get(
      "assignedToTelephonisteId"
    );
    const isConverted = searchParams.get("isConverted");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build query
    const query: any = {};

    if (statusId) {
      query.statusId = statusId;
    }

    if (assignedToTelephonisteId) {
      if (assignedToTelephonisteId === "unassigned") {
        query.assignedToTelephonisteId = { $exists: false };
      } else {
        query.assignedToTelephonisteId = assignedToTelephonisteId;
      }
    }

    if (isConverted !== null && isConverted !== undefined) {
      query.isConverted = isConverted === "true";
    }

    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Execute query
    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .populate("statusId")
        .populate("assignedToTelephonisteId", "name email")
        .populate("convertedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(query),
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts
 * Create a new contact
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    // Validate phone number
    if (!body.phone || !isValidPhone(body.phone)) {
      return NextResponse.json(
        { error: "Valid phone number is required" },
        { status: 400 }
      );
    }

    // Normalize phone
    const normalizedPhone = normalizePhone(body.phone);

    // Check if contact already exists
    const existingContact = await Contact.findOne({ phone: normalizedPhone });
    if (existingContact) {
      return NextResponse.json(
        { error: "Contact with this phone number already exists" },
        { status: 409 }
      );
    }

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

    // Get default "new" status
    const newStatus = await ContactStatus.findOne({ code: "new" });
    if (!newStatus) {
      return NextResponse.json(
        { error: "Default contact status not found. Please run seed script." },
        { status: 500 }
      );
    }

    // Create history context
    const historyCtx = createHistoryContext(session);
    if (!historyCtx) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Create contact
    const contact = await historyCtx.create(Contact, {
      phone: normalizedPhone,
      name: body.name,
      email: body.email,
      address: body.address,
      postalCode: body.postalCode,
      city: body.city,
      statusId: newStatus._id,
      statusHistory: [
        {
          statusId: newStatus._id,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      ],
      assignmentHistory: [],
      callHistory: [],
      notes: [],
      isConverted: false,
    });

    // Populate fields
    await contact.populate("statusId");

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

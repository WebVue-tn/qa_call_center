import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/lib/db";
import { getDocumentHistory } from "~/lib/utils/history-query-utils";
import User from "~/lib/db/models/User";
import Role from "~/lib/db/models/Role";
import AgentProfile from "~/lib/db/models/AgentProfile";
import ContactStatus from "~/lib/db/models/ContactStatus";
import Contact from "~/lib/db/models/Contact";
import Reservation from "~/lib/db/models/Reservation";

// Map model names to mongoose models
const modelMap: Record<string, any> = {
  users: User,
  roles: Role,
  agent_profiles: AgentProfile,
  contact_statuses: ContactStatus,
  contacts: Contact,
  reservations: Reservation,
};

/**
 * GET /api/history/[model]/[id]
 * Get history for a specific document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { model: string; id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { model, id } = params;
    const Model = modelMap[model];

    if (!Model) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : undefined;
    const action = searchParams.get("action") as
      | "create"
      | "update"
      | "delete"
      | undefined;
    const userId = searchParams.get("userId") || undefined;
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined;

    const history = await getDocumentHistory(Model, id, {
      limit,
      offset,
      action,
      userId,
      dateFrom,
      dateTo,
    });

    return NextResponse.json({
      documentId: id,
      model,
      history,
      total: history.length,
    });
  } catch (error) {
    console.error("Error fetching document history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

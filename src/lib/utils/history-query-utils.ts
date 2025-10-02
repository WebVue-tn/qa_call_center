import type { Model } from "mongoose";
import type { HistoryEntry } from "~/types/history";

interface HistoryQueryOptions {
  limit?: number;
  offset?: number;
  action?: "create" | "update" | "delete";
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Get history for a specific document
 */
export async function getDocumentHistory(
  Model: Model<any>,
  documentId: string,
  options: HistoryQueryOptions = {}
): Promise<HistoryEntry[]> {
  const doc = await Model.findById(documentId);
  if (!doc) return [];

  let history: HistoryEntry[] = doc.history || [];

  // Filter by action
  if (options.action) {
    history = history.filter((h) => h.action === options.action);
  }

  // Filter by user
  if (options.userId) {
    history = history.filter((h) => h.userId?.toString() === options.userId);
  }

  // Filter by date range
  if (options.dateFrom) {
    history = history.filter((h) => h.timestamp >= options.dateFrom!);
  }
  if (options.dateTo) {
    history = history.filter((h) => h.timestamp <= options.dateTo!);
  }

  // Sort by timestamp descending
  history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Pagination
  const offset = options.offset || 0;
  const limit = options.limit || history.length;

  return history.slice(offset, offset + limit);
}

/**
 * Get all changes made by a specific user across a collection
 */
export async function getUserActivityInCollection(
  Model: Model<any>,
  userId: string,
  options: {
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Array<{ documentId: string; history: HistoryEntry[] }>> {
  // Find all documents where the user appears in history
  const docs = await Model.find({
    "history.userId": userId,
  }).select("_id history");

  const results: Array<{ documentId: string; history: HistoryEntry[] }> = [];

  for (const doc of docs) {
    let userHistory: HistoryEntry[] = (doc.history || []).filter(
      (h: HistoryEntry) => h.userId?.toString() === userId
    );

    // Filter by date range
    if (options.dateFrom) {
      userHistory = userHistory.filter((h) => h.timestamp >= options.dateFrom!);
    }
    if (options.dateTo) {
      userHistory = userHistory.filter((h) => h.timestamp <= options.dateTo!);
    }

    if (userHistory.length > 0) {
      results.push({
        documentId: doc._id.toString(),
        history: userHistory,
      });
    }
  }

  // Sort by most recent activity
  results.sort((a, b) => {
    const aLatest = Math.max(...a.history.map((h) => h.timestamp.getTime()));
    const bLatest = Math.max(...b.history.map((h) => h.timestamp.getTime()));
    return bLatest - aLatest;
  });

  // Pagination
  const offset = options.offset || 0;
  const limit = options.limit || results.length;

  return results.slice(offset, offset + limit);
}

/**
 * Get recent changes across a collection
 */
export async function getRecentChanges(
  Model: Model<any>,
  options: {
    limit?: number;
    action?: "create" | "update" | "delete";
    dateFrom?: Date;
  } = {}
): Promise<Array<{ documentId: string; entry: HistoryEntry }>> {
  const docs = await Model.find({}).select("_id history");

  const allEntries: Array<{ documentId: string; entry: HistoryEntry }> = [];

  for (const doc of docs) {
    const history = doc.history || [];
    for (const entry of history) {
      // Apply filters
      if (options.action && entry.action !== options.action) continue;
      if (options.dateFrom && entry.timestamp < options.dateFrom) continue;

      allEntries.push({
        documentId: doc._id.toString(),
        entry,
      });
    }
  }

  // Sort by timestamp descending
  allEntries.sort(
    (a, b) => b.entry.timestamp.getTime() - a.entry.timestamp.getTime()
  );

  // Limit results
  const limit = options.limit || 50;
  return allEntries.slice(0, limit);
}

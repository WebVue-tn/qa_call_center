import type { Document, Model } from "mongoose";
import type { HistoryMetadata } from "~/types/history";

/**
 * Helper to wrap model operations with user context
 */
export class HistoryContext {
  private userId: string;
  private userSnapshot?: any;
  private metadata?: HistoryMetadata;

  constructor(userId: string, userSnapshot?: any, metadata?: HistoryMetadata) {
    this.userId = userId;
    this.userSnapshot = userSnapshot;
    this.metadata = metadata;
  }

  /**
   * Set user context on document
   */
  withUser<T extends Document>(doc: T): T {
    (doc as any)._currentUserId = this.userId;
    if (this.userSnapshot) {
      (doc as any)._currentUserSnapshot = this.userSnapshot;
    }
    if (this.metadata) {
      (doc as any)._currentMetadata = this.metadata;
    }
    return doc;
  }

  /**
   * Create a new document with user context
   */
  async create<T extends Document>(
    Model: Model<T>,
    data: any
  ): Promise<T> {
    const doc = new Model(data);
    this.withUser(doc);
    (doc as any).createdBy = this.userId;
    (doc as any).updatedBy = this.userId;
    await doc.save();
    return doc;
  }

  /**
   * Update existing document with user context
   */
  async update<T extends Document>(doc: T, updates: any): Promise<T> {
    Object.assign(doc, updates);
    (doc as any).updatedBy = this.userId;
    this.withUser(doc);
    await doc.save();
    return doc;
  }

  /**
   * Delete document with user context
   */
  async delete<T extends Document>(doc: T): Promise<T> {
    this.withUser(doc);
    await (doc as any).deleteOne();
    return doc;
  }

  /**
   * Bulk update with history tracking
   */
  async bulkUpdate<T extends Document>(
    Model: Model<T>,
    filter: any,
    updates: any
  ): Promise<void> {
    const docs = await Model.find(filter);

    for (const doc of docs) {
      await this.update(doc, updates);
    }
  }
}

/**
 * Helper to extract user ID and snapshot from session in API routes
 */
export function createHistoryContext(
  session: any,
  metadata?: HistoryMetadata
): HistoryContext | null {
  if (!session?.user?.id) return null;

  // Create a user snapshot from session data
  const userSnapshot = {
    _id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    isTelephoniste: session.user.isTelephoniste ?? false,
    isAdmin: session.user.isAdmin ?? false,
    isAgent: session.user.isAgent ?? false,
    adminRoles: session.user.adminRoles,
    agentRoles: session.user.agentRoles,
    adminDirectPermissions: session.user.adminDirectPermissions,
    agentDirectPermissions: session.user.agentDirectPermissions,
  };

  return new HistoryContext(session.user.id, userSnapshot, metadata);
}

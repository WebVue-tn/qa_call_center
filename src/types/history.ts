import { type Types } from "mongoose";

/**
 * Metadata captured with each history entry
 */
export interface HistoryMetadata {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Snapshot of the user who performed the action
 */
export interface UserSnapshot {
  _id: Types.ObjectId;
  name: string;
  email: string;
  isTelephoniste: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  adminRoles?: Types.ObjectId[];
  agentRoles?: Types.ObjectId[];
  adminDirectPermissions?: string[];
  agentDirectPermissions?: string[];
}

/**
 * Represents a single field change in an update operation
 */
export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Complete history entry for audit trail
 */
export interface HistoryEntry {
  action: "create" | "update" | "delete";
  timestamp: Date;
  userId?: Types.ObjectId;
  userSnapshot?: UserSnapshot;
  changes?: FieldChange[];
  initialDocument?: Record<string, unknown>;
  deletedDocument?: Record<string, unknown>;
  metadata?: HistoryMetadata;
}

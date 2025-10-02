import { Schema, type Model } from "mongoose";
import type { HistoryEntry } from "~/types/history";

interface HistoryOptions {
  excludeFields?: string[];
  captureMetadata?: boolean;
}

/**
 * Mongoose plugin to automatically track history on all CRUD operations
 */
export function historyPlugin(schema: Schema, options: HistoryOptions = {}) {
  const { excludeFields = ["history", "updatedAt", "__v"], captureMetadata = false } = options;

  // Add history field to schema
  schema.add({
    history: [
      {
        action: {
          type: String,
          enum: ["create", "update", "delete"],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
          required: true,
        },
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        userSnapshot: {
          type: Schema.Types.Mixed,
        },
        changes: [
          {
            field: String,
            oldValue: Schema.Types.Mixed,
            newValue: Schema.Types.Mixed,
          },
        ],
        initialDocument: Schema.Types.Mixed,
        deletedDocument: Schema.Types.Mixed,
        metadata: {
          ipAddress: String,
          userAgent: String,
          requestId: String,
        },
      },
    ],
  });

  // Post-init hook to capture original values for update tracking
  schema.post("init", function () {
    (this as any)._original = this.toObject();
  });

  // Pre-save hook for create and update
  schema.pre("save", async function (next) {
    const doc = this as any;

    // Get current user from context (set by API route)
    const userId = doc._currentUserId;
    const userSnapshot = doc._currentUserSnapshot;

    const isNew = doc.isNew;

    if (isNew) {
      // CREATE action
      const historyEntry: Partial<HistoryEntry> = {
        action: "create",
        timestamp: new Date(),
      };

      if (userId) {
        historyEntry.userId = userId;
      }

      if (userSnapshot) {
        historyEntry.userSnapshot = userSnapshot;
      }

      // Capture initial document (excluding history)
      const initialDoc = doc.toObject();
      delete initialDoc.history;
      historyEntry.initialDocument = initialDoc;

      if (captureMetadata && doc._currentMetadata) {
        historyEntry.metadata = doc._currentMetadata;
      }

      doc.history = doc.history || [];
      doc.history.push(historyEntry);
    } else {
      // UPDATE action
      const modifiedPaths = doc.modifiedPaths();
      const changes = [];

      for (const path of modifiedPaths) {
        if (excludeFields.includes(path)) continue;

        changes.push({
          field: path,
          oldValue: doc._original ? doc._original[path] : undefined,
          newValue: doc[path],
        });
      }

      if (changes.length > 0) {
        const historyEntry: Partial<HistoryEntry> = {
          action: "update",
          timestamp: new Date(),
          changes,
        };

        if (userId) {
          historyEntry.userId = userId;
        }

        if (userSnapshot) {
          historyEntry.userSnapshot = userSnapshot;
        }

        if (captureMetadata && doc._currentMetadata) {
          historyEntry.metadata = doc._currentMetadata;
        }

        doc.history = doc.history || [];
        doc.history.push(historyEntry);
      }
    }

    next();
  });

  // Pre-deleteOne hook for document deletion
  schema.pre("deleteOne", { document: true, query: false }, async function (next: any) {
    const doc = this as any;

    const userId = doc._currentUserId;
    const userSnapshot = doc._currentUserSnapshot;

    const historyEntry: Partial<HistoryEntry> = {
      action: "delete",
      timestamp: new Date(),
    };

    if (userId) {
      historyEntry.userId = userId;
    }

    if (userSnapshot) {
      historyEntry.userSnapshot = userSnapshot;
    }

    // Capture deleted document (excluding history)
    const deletedDoc = doc.toObject();
    delete deletedDoc.history;
    historyEntry.deletedDocument = deletedDoc;

    if (captureMetadata && doc._currentMetadata) {
      historyEntry.metadata = doc._currentMetadata;
    }

    doc.history = doc.history || [];
    doc.history.push(historyEntry);

    next();
  });

  // Add method to set current user context
  schema.methods.setCurrentUser = function (userId: string, userSnapshot?: any) {
    (this as any)._currentUserId = userId;
    (this as any)._currentUserSnapshot = userSnapshot;
    return this;
  };

  // Add method to set metadata
  schema.methods.setMetadata = function (metadata: any) {
    (this as any)._currentMetadata = metadata;
    return this;
  };
}

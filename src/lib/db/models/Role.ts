import mongoose, { Schema, type Model } from "mongoose";
import { historyPlugin } from "~/lib/middleware/history-middleware";
import type { HistoryEntry } from "~/types/history";

export interface IRole extends mongoose.Document {
  actor: "admin" | "agent";
  name: string;
  code: string;
  permissions: string[];

  // Audit fields
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // History tracking
  history: HistoryEntry[];

  // Methods for history context
  setCurrentUser(userId: string, userSnapshot?: any): this;
  setMetadata(metadata: any): this;
}

const RoleSchema = new Schema<IRole>(
  {
    actor: {
      type: String,
      enum: ["admin", "agent"],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    permissions: [
      {
        type: String,
        required: true,
      },
    ],

    // Audit fields
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Apply history plugin
RoleSchema.plugin(historyPlugin);

// Compound unique index for actor + code
RoleSchema.index({ actor: 1, code: 1 }, { unique: true });

const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);

export default Role;

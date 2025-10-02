import mongoose, { Schema, type Model } from "mongoose";
import { historyPlugin } from "~/lib/middleware/history-middleware";
import type { HistoryEntry } from "~/types/history";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;

  // Role flags
  isTelephoniste: boolean;
  isAdmin: boolean;
  isAgent: boolean;

  // Admin permissions
  adminRoles: mongoose.Types.ObjectId[];
  adminDirectPermissions: string[];

  // Agent permissions
  agentRoles: mongoose.Types.ObjectId[];
  agentDirectPermissions: string[];

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

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },

    // Role flags
    isTelephoniste: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isAgent: {
      type: Boolean,
      default: false,
    },

    // Admin permissions
    adminRoles: [
      {
        type: Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    adminDirectPermissions: [
      {
        type: String,
      },
    ],

    // Agent permissions
    agentRoles: [
      {
        type: Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    agentDirectPermissions: [
      {
        type: String,
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
UserSchema.plugin(historyPlugin);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ isTelephoniste: 1 });
UserSchema.index({ isAdmin: 1 });
UserSchema.index({ isAgent: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

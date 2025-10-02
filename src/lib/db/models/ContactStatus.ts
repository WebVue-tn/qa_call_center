import mongoose, { Schema, type Model } from "mongoose";
import { historyPlugin } from "~/lib/middleware/history-middleware";
import type { HistoryEntry } from "~/types/history";

export interface IContactStatus extends mongoose.Document {
  name: string;
  code: string;
  color: string;
  order: number;
  excludeFromCallList: boolean;
  isSystemStatus: boolean;
  isDeletable: boolean;

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

const ContactStatusSchema = new Schema<IContactStatus>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    color: {
      type: String,
      required: true,
      match: /^#[0-9A-F]{6}$/i,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    excludeFromCallList: {
      type: Boolean,
      default: false,
    },
    isSystemStatus: {
      type: Boolean,
      default: false,
    },
    isDeletable: {
      type: Boolean,
      default: true,
    },

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
ContactStatusSchema.plugin(historyPlugin);

// Indexes
ContactStatusSchema.index({ code: 1 });
ContactStatusSchema.index({ order: 1 });
ContactStatusSchema.index({ excludeFromCallList: 1 });

const ContactStatus: Model<IContactStatus> =
  mongoose.models.ContactStatus ||
  mongoose.model<IContactStatus>("ContactStatus", ContactStatusSchema);

export default ContactStatus;

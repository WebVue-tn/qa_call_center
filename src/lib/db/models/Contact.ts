import mongoose, { Schema, type Model } from "mongoose";
import { historyPlugin } from "~/lib/middleware/history-middleware";
import type { HistoryEntry } from "~/types/history";

export interface IStatusHistoryEntry {
  statusId: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
  note?: string;
}

export interface IAssignmentHistoryEntry {
  action: "assigned" | "unassigned" | "moved";
  fromUserId?: mongoose.Types.ObjectId;
  toUserId?: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
}

export interface ICallHistoryEntry {
  callSid: string;
  direction: "inbound" | "outbound";
  duration?: number;
  status: string;
  calledBy?: mongoose.Types.ObjectId;
  calledAt: Date;
}

export interface INote {
  content: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IContact extends mongoose.Document {
  phone: string;
  name?: string;
  email?: string;
  address?: string;
  postalCode?: string;
  city?: string;

  // Status tracking
  statusId: mongoose.Types.ObjectId;
  statusHistory: IStatusHistoryEntry[];

  // Assignment
  assignedToTelephonisteId?: mongoose.Types.ObjectId;
  assignmentHistory: IAssignmentHistoryEntry[];

  // Call tracking
  callHistory: ICallHistoryEntry[];

  // Notes
  notes: INote[];

  // Conversion tracking
  reservationId?: mongoose.Types.ObjectId;
  isConverted: boolean;
  convertedBy?: mongoose.Types.ObjectId;
  convertedAt?: Date;

  // Metadata
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

const StatusHistoryEntrySchema = new Schema<IStatusHistoryEntry>(
  {
    statusId: {
      type: Schema.Types.ObjectId,
      ref: "ContactStatus",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    note: String,
  },
  { _id: false }
);

const AssignmentHistoryEntrySchema = new Schema<IAssignmentHistoryEntry>(
  {
    action: {
      type: String,
      enum: ["assigned", "unassigned", "moved"],
      required: true,
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: false }
);

const CallHistoryEntrySchema = new Schema<ICallHistoryEntry>(
  {
    callSid: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    duration: Number,
    status: {
      type: String,
      required: true,
    },
    calledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    calledAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: false }
);

const NoteSchema = new Schema<INote>(
  {
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: false }
);

const ContactSchema = new Schema<IContact>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{10}$/,
    },
    name: String,
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: String,
    postalCode: {
      type: String,
      match: /^[A-Z]\d[A-Z]\s\d[A-Z]\d$/,
    },
    city: String,

    // Status tracking
    statusId: {
      type: Schema.Types.ObjectId,
      ref: "ContactStatus",
      required: true,
    },
    statusHistory: [StatusHistoryEntrySchema],

    // Assignment
    assignedToTelephonisteId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignmentHistory: [AssignmentHistoryEntrySchema],

    // Call tracking
    callHistory: [CallHistoryEntrySchema],

    // Notes
    notes: [NoteSchema],

    // Conversion tracking
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
    },
    isConverted: {
      type: Boolean,
      default: false,
    },
    convertedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    convertedAt: Date,

    // Metadata
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
ContactSchema.plugin(historyPlugin);

// Indexes
ContactSchema.index({ phone: 1 });
ContactSchema.index({ statusId: 1 });
ContactSchema.index({ assignedToTelephonisteId: 1 });
ContactSchema.index({ isConverted: 1 });
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ statusId: 1, assignedToTelephonisteId: 1 });
ContactSchema.index({ email: 1 });
ContactSchema.index({ postalCode: 1 });

const Contact: Model<IContact> =
  mongoose.models.Contact || mongoose.model<IContact>("Contact", ContactSchema);

export default Contact;

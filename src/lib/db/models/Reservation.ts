import mongoose, { Schema, type Model } from "mongoose";
import { historyPlugin } from "~/lib/middleware/history-middleware";
import type { HistoryEntry } from "~/types/history";

export interface ICustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  postalCode?: string;
  city?: string;
}

export interface IReservationNote {
  content: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IReservation extends mongoose.Document {
  contactId: mongoose.Types.ObjectId;
  date: Date;
  assignedToAgentId: mongoose.Types.ObjectId;
  status: string;

  // Customer info (copied from contact at conversion)
  customerInfo: ICustomerInfo;

  notes: IReservationNote[];

  // Audit fields
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // History tracking
  history: HistoryEntry[];

  // Methods for history context
  setCurrentUser(userId: string, userSnapshot?: any): this;
  setMetadata(metadata: any): this;
}

const CustomerInfoSchema = new Schema<ICustomerInfo>(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: String,
    address: String,
    postalCode: String,
    city: String,
  },
  { _id: false }
);

const ReservationNoteSchema = new Schema<IReservationNote>(
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

const ReservationSchema = new Schema<IReservation>(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    assignedToAgentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "scheduled",
    },

    // Customer info
    customerInfo: {
      type: CustomerInfoSchema,
      required: true,
    },

    notes: [ReservationNoteSchema],

    // Audit fields
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
ReservationSchema.plugin(historyPlugin);

// Indexes
ReservationSchema.index({ contactId: 1 });
ReservationSchema.index({ assignedToAgentId: 1 });
ReservationSchema.index({ date: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ assignedToAgentId: 1, date: 1 });
ReservationSchema.index({ createdAt: -1 });

const Reservation: Model<IReservation> =
  mongoose.models.Reservation ||
  mongoose.model<IReservation>("Reservation", ReservationSchema);

export default Reservation;

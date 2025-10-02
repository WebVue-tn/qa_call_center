import mongoose, { Schema, type Model } from "mongoose";
import { historyPlugin } from "~/lib/middleware/history-middleware";
import type { HistoryEntry } from "~/types/history";

export interface IAvailabilitySlot {
  startDateTime: Date;
  endDateTime: Date;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: "daily" | "weekly";
    daysOfWeek?: number[]; // 0-6 for weekly (0 = Sunday)
    endDate?: Date;
  };
}

export interface IAgentProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  availability: IAvailabilitySlot[];

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

const AvailabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ["daily", "weekly"],
      },
      daysOfWeek: [
        {
          type: Number,
          min: 0,
          max: 6,
        },
      ],
      endDate: Date,
    },
  },
  { _id: false }
);

const AgentProfileSchema = new Schema<IAgentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    availability: [AvailabilitySlotSchema],

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
AgentProfileSchema.plugin(historyPlugin);

// Indexes
AgentProfileSchema.index({ userId: 1 });

const AgentProfile: Model<IAgentProfile> =
  mongoose.models.AgentProfile ||
  mongoose.model<IAgentProfile>("AgentProfile", AgentProfileSchema);

export default AgentProfile;

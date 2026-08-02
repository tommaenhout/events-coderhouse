import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    organizer: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    collection: "events",
    timestamps: true,
    versionKey: false,
  },
);

export const Event = mongoose.model("Event", eventSchema);

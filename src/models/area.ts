import { Schema, model, models } from "mongoose";

const areaSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      en: { type: String, required: true, trim: true },
      hi: { type: String, trim: true },
      pa: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Area = models.Area || model("Area", areaSchema);

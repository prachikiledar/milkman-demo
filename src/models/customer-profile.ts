import { Schema, model, models, Types } from "mongoose";

const customerProfileSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    customerCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
    },
    areaCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    areaName: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    deliveryInstruction: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const CustomerProfile =
  models.CustomerProfile || model("CustomerProfile", customerProfileSchema);

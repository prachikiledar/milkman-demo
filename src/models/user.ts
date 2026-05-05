import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["CUSTOMER", "ADMIN"],
      required: true,
      default: "CUSTOMER",
    },
    name: {
      en: { type: String, trim: true },
      hi: { type: String, trim: true },
      pa: { type: String, trim: true },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "hi", "pa"],
      default: "en",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

export const User = models.User || model("User", userSchema);

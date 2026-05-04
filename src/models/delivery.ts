import { Schema, model, models, Types } from "mongoose";

const deliverySchema = new Schema(
  {
    customerId: {
      type: Types.ObjectId,
      ref: "CustomerProfile",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    defaultQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    actualQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    extraQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    pricePerLiter: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["DELIVERED", "SKIPPED", "PAUSED"],
      required: true,
      default: "DELIVERED",
    },
    note: {
      type: String,
      trim: true,
    },
    items: [
      {
        productId: {
          type: Types.ObjectId,
          ref: "Product",
        },
        productCode: {
          type: String,
          trim: true,
          uppercase: true,
        },
        productName: {
          type: String,
          trim: true,
        },
        category: {
          type: String,
          enum: ["MILK", "DAIRY_ADDON", "OTHER"],
          default: "DAIRY_ADDON",
        },
        unit: {
          type: String,
          trim: true,
          default: "UNIT",
        },
        quantity: {
          type: Number,
          min: 0,
          default: 0,
        },
        rate: {
          type: Number,
          min: 0,
          default: 0,
        },
        totalAmount: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
    ],
    markedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export const Delivery = models.Delivery || model("Delivery", deliverySchema);

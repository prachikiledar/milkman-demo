import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { Area } from "@/models/area";
import { CustomerProfile } from "@/models/customer-profile";
import { MilkPlan } from "@/models/milk-plan";
import { User } from "@/models/user";

const customerSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  preferredLanguage: z.enum(["en", "hi"]).optional(),
  addressLine1: z.string().trim().min(3),
  addressLine2: z.string().trim().optional(),
  areaCode: z.string().trim().min(1),
  landmark: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  deliveryInstruction: z.string().trim().optional(),
  quantityLiters: z.number().positive(),
  pricePerLiter: z.number().nonnegative(),
  unitLabel: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PAUSED"]).optional(),
});

async function createCustomerCode() {
  const count = await CustomerProfile.countDocuments();
  return `CUST${String(count + 1).padStart(3, "0")}`;
}

export async function GET() {
  await connectToDatabase();
  const customers = await CustomerProfile.find().sort({ customerCode: 1 }).lean();
  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const payload = customerSchema.parse(await request.json());
    const area = await Area.findOne({ code: payload.areaCode }).lean();

    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    const existingUser = await User.findOne({ phone: payload.phone }).lean();
    if (existingUser) {
      return NextResponse.json({ error: "Phone is already linked to another customer" }, { status: 409 });
    }

    const customerCode = await createCustomerCode();
    const user = await User.create({
      role: "CUSTOMER",
      name: payload.name,
      phone: payload.phone,
      preferredLanguage: payload.preferredLanguage ?? "en",
      status: payload.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      passwordHash: "seeded-password",
    });

    const profile = await CustomerProfile.create({
      userId: user._id,
      customerCode,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2 || "",
      areaCode: area.code,
      areaName: area.name,
      area: area.name,
      landmark: payload.landmark || "",
      notes: payload.notes || "",
      deliveryInstruction: payload.deliveryInstruction || "",
      isActive: payload.status !== "INACTIVE",
    });

    const plan = await MilkPlan.create({
      customerId: profile._id,
      quantityLiters: payload.quantityLiters,
      pricePerLiter: payload.pricePerLiter,
      unitLabel: payload.unitLabel || "L",
      startDate: new Date(),
      isActive: true,
    });

    return NextResponse.json({ user, profile, plan }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}

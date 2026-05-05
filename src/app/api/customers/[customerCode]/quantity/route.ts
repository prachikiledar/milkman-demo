import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { CustomerProfile } from "@/models/customer-profile";
import { MilkPlan } from "@/models/milk-plan";

const quantitySchema = z.object({
  quantityLiters: z.number().nonnegative(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ customerCode: string }> }
) {
  try {
    await connectToDatabase();
    const { customerCode } = await params;
    const body = await request.json();
    const { quantityLiters } = quantitySchema.parse(body);

    const profile = await CustomerProfile.findOne({ customerCode }).lean();
    if (!profile) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const plan = await MilkPlan.findOneAndUpdate(
      { customerId: profile._id, isActive: true },
      { $set: { quantityLiters } },
      { sort: { startDate: -1 }, new: true }
    );

    if (!plan) {
      return NextResponse.json({ error: "Active plan not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, quantityLiters: plan.quantityLiters });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Failed to update quantity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { MilkEntry } from "@/models/milk-entry";
import { Vendor } from "@/models/vendor";

const milkEntrySchema = z.object({
  vendorCode: z.string().trim().min(1),
  date: z.string().trim().min(1),
  quantity: z.number().positive(),
  rate: z.number().nonnegative(),
  status: z.enum(["PAID", "UNPAID"]),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    await connectToDatabase();
    const { entryId } = await params;
    const payload = milkEntrySchema.parse(await request.json());

    const [entry, vendor] = await Promise.all([
      MilkEntry.findById(entryId),
      Vendor.findOne({ code: payload.vendorCode }).lean(),
    ]);

    if (!entry) {
      return NextResponse.json({ error: "Milk entry not found" }, { status: 404 });
    }

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    entry.vendorId = vendor._id;
    entry.vendorCode = vendor.code;
    entry.vendorName = vendor.name;
    entry.date = new Date(payload.date);
    entry.quantity = payload.quantity;
    entry.rate = payload.rate;
    entry.total = payload.quantity * payload.rate;
    entry.status = payload.status;
    await entry.save();

    return NextResponse.json({ entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update milk entry" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  await connectToDatabase();
  const { entryId } = await params;
  const deleted = await MilkEntry.findByIdAndDelete(entryId).lean();

  if (!deleted) {
    return NextResponse.json({ error: "Milk entry not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

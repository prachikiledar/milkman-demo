import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { normalizeAreaCode } from "@/lib/areas";
import { Area } from "@/models/area";
import { MilkEntry } from "@/models/milk-entry";
import { Vendor } from "@/models/vendor";
import { PurchaseEntry } from "@/models/purchase-entry";

const vendorSchema = z.object({
  code: z.string().trim().optional(),
  name: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  defaultRate: z.number().nonnegative().optional(),
  areaCode: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ vendorCode: string }> }
) {
  try {
    await connectToDatabase();
    const { vendorCode } = await params;
    const payload = vendorSchema.parse(await request.json());
    const nextCode = normalizeAreaCode(payload.code || payload.name);
    const vendor = await Vendor.findOne({ code: vendorCode });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (nextCode !== vendorCode) {
      const duplicate = await Vendor.findOne({ code: nextCode }).lean();
      if (duplicate) {
        return NextResponse.json({ error: "Vendor code already exists" }, { status: 409 });
      }
    }

    const area = payload.areaCode ? await Area.findOne({ code: payload.areaCode }).lean() : null;

    vendor.code = nextCode;
    vendor.name = payload.name;
    vendor.phone = payload.phone || "";
    vendor.defaultRate = payload.defaultRate ?? vendor.defaultRate;
    vendor.areaCode = area?.code || payload.areaCode || "";
    vendor.areaName = area?.name || "";
    vendor.notes = payload.notes || "";
    vendor.isActive = payload.isActive ?? vendor.isActive;
    await vendor.save();

    await PurchaseEntry.updateMany(
      { vendorCode },
      { $set: { vendorCode: vendor.code, vendorName: vendor.name } },
    );
    await MilkEntry.updateMany(
      { vendorCode },
      { $set: { vendorCode: vendor.code, vendorName: vendor.name } },
    );

    return NextResponse.json({ vendor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ vendorCode: string }> }
) {
  await connectToDatabase();
  const { vendorCode } = await params;
  const [linkedPurchases, linkedMilkEntries] = await Promise.all([
    PurchaseEntry.countDocuments({ vendorCode }),
    MilkEntry.countDocuments({ vendorCode }),
  ]);

  if (linkedPurchases > 0 || linkedMilkEntries > 0) {
    return NextResponse.json(
      { error: "Cannot delete a vendor with linked entries" },
      { status: 409 },
    );
  }

  const deleted = await Vendor.findOneAndDelete({ code: vendorCode }).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/product";
import { PurchaseEntry } from "@/models/purchase-entry";
import { Vendor } from "@/models/vendor";

const purchaseSchema = z.object({
  vendorCode: z.string().trim().min(1),
  productCode: z.string().trim().min(1),
  quantity: z.number().positive(),
  rate: z.number().nonnegative(),
  paymentStatus: z.enum(["UNPAID", "PARTIAL", "PAID"]).optional(),
  note: z.string().trim().optional(),
  date: z.string().trim().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
    await connectToDatabase();
    const { purchaseId } = await params;
    const payload = purchaseSchema.parse(await request.json());

    const [entry, vendor, product] = await Promise.all([
      PurchaseEntry.findById(purchaseId),
      Vendor.findOne({ code: payload.vendorCode }).lean(),
      Product.findOne({ code: payload.productCode }).lean(),
    ]);

    if (!entry) {
      return NextResponse.json({ error: "Purchase entry not found" }, { status: 404 });
    }
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    entry.vendorId = vendor._id;
    entry.vendorCode = vendor.code;
    entry.vendorName = vendor.name;
    entry.productId = product._id;
    entry.productCode = product.code;
    entry.productName = product.name;
    entry.productCategory = product.category;
    entry.unit = product.unit;
    entry.quantity = payload.quantity;
    entry.rate = payload.rate;
    entry.totalAmount = payload.quantity * payload.rate;
    entry.paymentStatus = payload.paymentStatus ?? entry.paymentStatus;
    entry.note = payload.note || "";
    entry.date = payload.date ? new Date(payload.date) : entry.date;
    await entry.save();

    return NextResponse.json({ purchase: entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update purchase entry" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  await connectToDatabase();
  const { purchaseId } = await params;
  const deleted = await PurchaseEntry.findByIdAndDelete(purchaseId).lean();

  if (!deleted) {
    return NextResponse.json({ error: "Purchase entry not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

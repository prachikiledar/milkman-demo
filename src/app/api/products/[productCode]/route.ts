import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { normalizeAreaCode } from "@/lib/areas";
import { Product } from "@/models/product";

const productSchema = z.object({
  code: z.string().trim().optional(),
  name: z.string().trim().min(2),
  category: z.enum(["MILK", "DAIRY_ADDON", "OTHER"]),
  unit: z.string().trim().min(1),
  defaultRate: z.number().nonnegative(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ productCode: string }> }
) {
  try {
    await connectToDatabase();
    const { productCode } = await params;
    const payload = productSchema.parse(await request.json());
    const nextCode = normalizeAreaCode(payload.code || payload.name);

    const existing = await Product.findOne({ code: productCode });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (nextCode !== productCode) {
      const duplicate = await Product.findOne({ code: nextCode }).lean();
      if (duplicate) {
        return NextResponse.json({ error: "Product code already exists" }, { status: 409 });
      }
    }

    existing.code = nextCode;
    existing.name = payload.name;
    existing.category = payload.category;
    existing.unit = payload.unit;
    existing.defaultRate = payload.defaultRate;
    existing.isActive = payload.isActive ?? existing.isActive;
    await existing.save();

    return NextResponse.json({ product: existing });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productCode: string }> }
) {
  await connectToDatabase();
  const { productCode } = await params;
  const deleted = await Product.findOneAndDelete({ code: productCode }).lean();

  if (!deleted) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

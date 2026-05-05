import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { normalizeAreaCode } from "@/lib/areas";
import { Area } from "@/models/area";
import { CustomerProfile } from "@/models/customer-profile";

const areaSchema = z.object({
  code: z.string().trim().optional(),
  name: z.string().trim().min(2, "Area name is required"),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ areaCode: string }> }
) {
  try {
    await connectToDatabase();
    const { areaCode } = await params;

    const area = await Area.findOne({ code: areaCode }).lean();

    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    return NextResponse.json({
      area: {
        code: area.code,
        name: area.name,
        isActive: area.isActive,
        sortOrder: area.sortOrder,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch area", detail: String(error) },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ areaCode: string }> }
) {
  try {
    await connectToDatabase();
    const { areaCode } = await params;
    const payload = areaSchema.parse(await request.json());
    const nextCode = normalizeAreaCode(payload.code || payload.name);

    const area = await Area.findOne({ code: areaCode });

    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    if (nextCode !== areaCode) {
      const duplicate = await Area.findOne({ code: nextCode }).lean();

      if (duplicate) {
        return NextResponse.json({ error: "Area code already exists" }, { status: 409 });
      }
    }

    area.code = nextCode;
    area.name = payload.name;
    area.isActive = payload.isActive ?? area.isActive;
    await area.save();

    await CustomerProfile.updateMany(
      { areaCode },
      {
        $set: {
          areaCode: nextCode,
          areaName: payload.name,
          area: payload.name,
        },
      },
    );

    return NextResponse.json({
      area: {
        code: area.code,
        name: area.name,
        isActive: area.isActive,
        sortOrder: area.sortOrder,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update area", detail: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ areaCode: string }> }
) {
  try {
    await connectToDatabase();
    const { areaCode } = await params;

    const linkedCustomers = await CustomerProfile.countDocuments({ areaCode });

    if (linkedCustomers > 0) {
      return NextResponse.json(
        { error: "Cannot delete an area that is linked to customers" },
        { status: 409 },
      );
    }

    const deleted = await Area.findOneAndDelete({ code: areaCode }).lean();

    if (!deleted) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete area", detail: String(error) },
      { status: 500 },
    );
  }
}

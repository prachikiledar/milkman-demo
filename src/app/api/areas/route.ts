import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { defaultAreaMaster, normalizeAreaCode } from "@/lib/areas";
import { Area } from "@/models/area";

const areaSchema = z.object({
  code: z.string().trim().optional(),
  name: z.union([
    z.string().trim().min(2, "Area name is required"),
    z.object({
      en: z.string().trim().min(2),
      hi: z.string().trim().optional(),
      pa: z.string().trim().optional(),
    }),
  ]),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    await connectToDatabase();

    const areas = await Area.find().sort({ sortOrder: 1, name: 1 }).lean();

    if (!areas.length) {
      return NextResponse.json({ areas: defaultAreaMaster });
    }

    return NextResponse.json({
      areas: areas.map((area) => ({
        code: area.code,
        name: area.name,
        isActive: area.isActive,
        sortOrder: area.sortOrder,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch areas", detail: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const payload = areaSchema.parse(await request.json());
    const nameForCode = typeof payload.name === "string" ? payload.name : payload.name.en;
    const code = normalizeAreaCode(payload.code || nameForCode);

    const existing = await Area.findOne({ code }).lean();

    if (existing) {
      return NextResponse.json({ error: "Area code already exists" }, { status: 409 });
    }

    const area = await Area.create({
      code,
      name: payload.name,
      isActive: payload.isActive ?? true,
      sortOrder: await Area.countDocuments(),
    });

    return NextResponse.json(
      {
        area: {
          code: area.code,
          name: area.name,
          isActive: area.isActive,
          sortOrder: area.sortOrder,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create area", detail: String(error) },
      { status: 500 },
    );
  }
}

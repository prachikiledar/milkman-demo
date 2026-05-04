import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { getDeliveryRunData } from "@/lib/data-service";
import { CustomerProfile } from "@/models/customer-profile";
import { Delivery } from "@/models/delivery";
import { DeliveryException } from "@/models/delivery-exception";
import { MilkPlan } from "@/models/milk-plan";

const deliverySchema = z.object({
  customerCode: z.string().trim().min(1),
  status: z.enum(["DELIVERED", "SKIPPED", "PAUSED"]),
  actualQuantity: z.number().nonnegative().optional(),
  extraQuantity: z.number().optional(),
  note: z.string().trim().optional(),
  date: z.string().trim().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "ALL";
  const entries = await getDeliveryRunData({
    date: searchParams.get("date") || undefined,
    areaCode: searchParams.get("area") || undefined,
    status:
      status === "DELIVERED" || status === "SKIPPED" || status === "PAUSED" || status === "PENDING"
        ? status
        : "ALL",
  });

  return NextResponse.json({
    entries,
    counts: {
      delivered: entries.filter((entry) => entry.status === "DELIVERED").length,
      skipped: entries.filter((entry) => entry.status === "SKIPPED").length,
      paused: entries.filter((entry) => entry.status === "PAUSED").length,
      pending: entries.filter((entry) => entry.status === "PENDING").length,
    },
  });
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const payload = deliverySchema.parse(await request.json());
    const customer = await CustomerProfile.findOne({ customerCode: payload.customerCode }).lean();

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const targetDate = payload.date ? new Date(payload.date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const status = payload.status;
    const activePlan = await MilkPlan.findOne({ customerId: customer._id, isActive: true })
      .sort({ startDate: -1 })
      .lean<{ quantityLiters?: number; pricePerLiter?: number } | null>();

    const defaultQuantity = activePlan?.quantityLiters || 0;
    
    // Calculate actual and extra
    let actualQuantity = payload.actualQuantity ?? defaultQuantity;
    if (status !== "DELIVERED") {
      actualQuantity = 0;
    }
    const extraQuantity = actualQuantity - defaultQuantity;

    // Use findOneAndUpdate with upsert for consistency
    const delivery = await Delivery.findOneAndUpdate(
      {
        customerId: customer._id,
        date: { $gte: dayStart, $lte: dayEnd },
      },
      {
        $set: {
          customerId: customer._id,
          date: targetDate,
          status,
          defaultQuantity,
          actualQuantity,
          extraQuantity,
          pricePerLiter: activePlan?.pricePerLiter || 0,
          note: payload.note || "",
        }
      },
      { upsert: true, new: true }
    );

    // Sync exceptions for backward compatibility or legacy logic
    if (status === "DELIVERED") {
      await DeliveryException.deleteOne({
        customerId: customer._id,
        date: { $gte: dayStart, $lte: dayEnd },
      });
    } else {
      await DeliveryException.findOneAndUpdate(
        {
          customerId: customer._id,
          date: { $gte: dayStart, $lte: dayEnd },
        },
        {
          $set: {
            customerId: customer._id,
            date: targetDate,
            type: status === "PAUSED" ? "PAUSE" : "SKIP",
          }
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ delivery });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save delivery" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const customerCode = searchParams.get("customerCode");
    const dateStr = searchParams.get("date");

    if (!customerCode) {
      return NextResponse.json({ error: "Customer code is required" }, { status: 400 });
    }

    const customer = await CustomerProfile.findOne({ customerCode }).lean();
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    await Promise.all([
      Delivery.deleteOne({
        customerId: customer._id,
        date: { $gte: dayStart, $lte: dayEnd },
      }),
      DeliveryException.deleteOne({
        customerId: customer._id,
        date: { $gte: dayStart, $lte: dayEnd },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset delivery" },
      { status: 500 },
    );
  }
}

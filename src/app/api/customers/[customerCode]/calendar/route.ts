import { NextResponse } from "next/server";
import { getCustomerMonthlyCalendar } from "@/lib/data-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerCode: string }> }
) {
  const { customerCode } = await params;
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const calendarData = await getCustomerMonthlyCalendar(customerCode, month, year);

  if (!calendarData) {
    return NextResponse.json({ error: "Calendar data not found" }, { status: 404 });
  }

  return NextResponse.json(calendarData);
}

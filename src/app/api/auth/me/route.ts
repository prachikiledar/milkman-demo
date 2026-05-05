import { NextResponse } from "next/server";

export async function GET() {
  // Bypassed for public access
  return NextResponse.json({
    success: true,
    user: {
      id: "67c7e6884391e452a2656910",
      phone: "8888888888",
      role: "ADMIN",
      name: "",
    },
    profile: {
      customerCode: "DEMO-001",
      areaCode: "GN",
      areaName: "Ghuman Nagar",
    },
    area: {
      code: "GN",
      name: "Ghuman Nagar"
    }
  });
}

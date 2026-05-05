import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/user";
import { CustomerProfile } from "@/models/customer-profile";
import { Area } from "@/models/area";

export async function GET() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(String(decoded.id)).select("-otp -otpExpiry");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let profile = null;
    let areaData = null;

    if (user.role === "CUSTOMER") {
      profile = await CustomerProfile.findOne({ userId: user._id });
      if (profile && profile.areaCode) {
        areaData = await Area.findOne({ code: profile.areaCode });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        name: user.name,
      },
      profile,
      area: areaData
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

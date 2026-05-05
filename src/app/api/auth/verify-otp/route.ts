import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/user";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { phone, otp, intendedRole } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
    }

    await connectToDatabase();

    let user = await User.findOne({ phone });

    if (!user) {
      // Auto-create user in dev bypass if not found
      if (process.env.NODE_ENV === "development" && otp === "123456") {
        const isMagicAdmin = phone === "8888888888";
        user = await User.create({
          phone,
          role: (intendedRole === "admin" || isMagicAdmin) ? "ADMIN" : "CUSTOMER",
          status: "ACTIVE"
        });
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Bypass OTP verification in development mode
    const isDevBypass = process.env.NODE_ENV === "development" && otp === "123456";
    console.log("user", user)
    console.log("isDEvBypass", isDevBypass)
    if (!isDevBypass) {
      // Check if OTP matches and is not expired
      if (user.otp !== otp) {
        return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
      }

      if (new Date() > user.otpExpiry) {
        return NextResponse.json({ error: "OTP expired" }, { status: 401 });
      }
    }

    // Update role based on intent if provided
    if (intendedRole === "admin" || intendedRole === "customer") {
      user.role = intendedRole === "admin" ? "ADMIN" : "CUSTOMER";
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Auto-provision customer profile if missing
    if (user.role === "CUSTOMER") {
      const { CustomerProfile } = await import("@/models/customer-profile");
      const { MilkPlan } = await import("@/models/milk-plan");
      const { Area } = await import("@/models/area");

      let profile = await CustomerProfile.findOne({ userId: user._id });
      if (!profile) {
        const defaultArea = await Area.findOne() || { code: "GN", name: "Ghuman Nagar" };
        profile = await CustomerProfile.create({
          userId: user._id,
          customerCode: `CUST-${user.phone.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`,
          addressLine1: "Set your address",
          areaCode: defaultArea.code,
          areaName: defaultArea.name,
        });

        // Create default milk plan
        await MilkPlan.create({
          customerId: profile._id,
          quantityLiters: 1.0,
          pricePerLiter: 66,
          startDate: new Date(),
          isActive: true
        });
      }
    }

    // Create JWT token
    const token = await signToken({
      id: String(user._id),
      phone: user.phone,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        name: user.name || user.phone,
      },
    });

    // Set cookie for server-side auth
    const cookieName = `token_${user.role}`;
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Also set a generic token cookie for general use
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

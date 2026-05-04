import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/user";
import { generateOTP } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    await connectToDatabase();

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Find user by phone, or create if not exists
    let user = await User.findOne({ phone });

    if (user) {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      user = await User.create({
        phone,
        otp,
        otpExpiry,
        role: "CUSTOMER", // Default role
      });
    }

    // Log OTP in console as per requirement
    console.log(`[OTP] For ${phone}: ${otp}`);

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

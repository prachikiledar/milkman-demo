import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";
const secret = new TextEncoder().encode(JWT_SECRET);

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function signToken(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(role?: "ADMIN" | "CUSTOMER") {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  
  let token = null;
  
  if (role) {
    token = cookieStore.get(`token_${role}`)?.value;
  }
  
  if (!token) {
    token = cookieStore.get("token_ADMIN")?.value || 
            cookieStore.get("token_CUSTOMER")?.value || 
            cookieStore.get("token")?.value;
  }

  if (!token) return null;
  return verifyToken(token);
}

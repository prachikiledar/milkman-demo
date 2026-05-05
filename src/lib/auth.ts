export async function signToken(payload: any) {
  return "demo-token";
}

export async function verifyToken(token: string) {
  return {
    id: "67c7e6884391e452a2656910",
    phone: "8888888888",
    role: "ADMIN",
    name: "",
  };
}

export async function getCurrentUser(role?: "ADMIN" | "CUSTOMER") {
  return {
    id: "67c7e6884391e452a2656910",
    phone: "8888888888",
    role: role || "ADMIN",
    name: "",
  };
}

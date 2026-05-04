"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, LogIn } from "lucide-react";
import Link from "next/link";

export function UserMenu({ locale }: { locale: string }) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = () => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        setUser(JSON.parse(userStr));
      } else {
        setUser(null);
      }
    };

    checkUser();

    // Listen for storage changes (e.g. from LoginForm clearing the session)
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push(`/${locale}/login`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 font-medium">
        <User size={16} />
        <span>{user.phone}</span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-all border border-gray-200"
      >
        <LogOut size={16} />
        <span className="hidden xs:inline">Sign Out</span>
      </button>
    </div>
  );
}

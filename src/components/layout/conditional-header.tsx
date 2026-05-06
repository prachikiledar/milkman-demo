"use client";

import { usePathname } from "next/navigation";

export function ConditionalHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide the platform header on any admin routes because they have their own shell
  if (pathname && pathname.includes("/admin")) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { useEffect, useRef } from "react";
import { BarChart2, Eye, FilePenLine, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type CustomerCardActionsProps = {
  id: string;
  customerCode: string;
  locale: string;
  onView?: (mode: "view" | "details" | "schedule" | "edit") => void;
  isMenuOpen?: boolean;
  setMenuOpen?: (isOpen: boolean) => void;
};

export function CustomerCardActions({
  id,
  customerCode,
  locale,
  onView,
  isMenuOpen = false,
  setMenuOpen,
}: CustomerCardActionsProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside[cite: 1]
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen?.(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, setMenuOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Prevents ARTICLE row click
          setMenuOpen?.(!isMenuOpen);
        }}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-90",
          isMenuOpen
            ? "bg-gray-100 border-gray-300 text-[#064e3b]"
            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
        )}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isMenuOpen && (
        <div
          className="absolute right-0 top-full z-[110] mt-2 w-44 origin-top-right overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()} // Prevents dropdown clicks from opening detail page
        >
          <div className="py-1.5">
            <button
              onClick={() => { setMenuOpen?.(false); onView?.("view"); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Eye className="h-4.5 w-4.5 text-gray-400" />
              View Profile
            </button>
            <button
              onClick={() => { setMenuOpen?.(false); onView?.("details"); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <BarChart2 className="h-4.5 w-4.5 text-gray-400" />
              Usage Log
            </button>
            <div className="h-px bg-gray-100 mx-3 my-1" />
            <button
              onClick={() => { setMenuOpen?.(false); onView?.("edit"); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-[#064e3b] transition-colors hover:bg-green-50"
            >
              <FilePenLine className="h-4.5 w-4.5 text-green-600" />
              Edit Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
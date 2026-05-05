"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BarChart2, Eye, FilePenLine, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type CustomerCardActionsProps = {
  id: string;
  customerCode: string;
  locale: string;
  onView?: (mode: "view" | "details") => void;
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
    <div className="flex items-center gap-2">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => { 
            e.stopPropagation();
            setMenuOpen?.(!isMenuOpen); 
          }}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-all active:scale-90 hover:bg-gray-50",
            isMenuOpen ? "bg-gray-100 border-gray-300" : ""
          )}
          aria-label="More options"
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {isMenuOpen && (
            <div 
              className="absolute right-0 top-full z-[100] mt-2 w-48 origin-top-right overflow-hidden rounded-[22px] border border-gray-200 bg-white opacity-100 shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in duration-200"
              style={{ top: "100%", backgroundColor: "white" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1.5 bg-white">
                <button
                  onClick={() => { setMenuOpen?.(false); onView?.("view"); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Eye className="h-4.5 w-4.5 text-gray-400" />
                  View
                </button>
                <button
                  onClick={() => { setMenuOpen?.(false); onView?.("details"); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <BarChart2 className="h-4.5 w-4.5 text-gray-400" />
                  Details
                </button>
                <button
                  onClick={() => { setMenuOpen?.(false); onView?.("edit" as any); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FilePenLine className="h-4.5 w-4.5 text-gray-400" />
                  Edit
                </button>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { locales, localeLabels, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Compact, mobile-friendly language selector dropdown.
 * - Collapsed state shows only the active language code.
 * - Opens a dropdown with full language names on click.
 */
export function LanguageSwitcher({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchTo = (next: AppLocale) => {
    if (next === locale || isPending) {
      setIsOpen(false);
      return;
    }

    // Update URL with new locale
    const segments = (pathname ?? "/").split("/").filter(Boolean);
    if (segments.length === 0) {
      segments.push(next);
    } else {
      segments[0] = next;
    }

    const query = searchParams?.toString();
    const target = `/${segments.join("/")}${query ? `?${query}` : ""}`;

    // Persist locale preference
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }

    startTransition(() => {
      router.replace(target);
      router.refresh();
      setIsOpen(false);
    });
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Compact Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isPending}
      >
        <span className="text-[13px] font-bold text-black uppercase tracking-tight">
          {localeLabels[locale].short}
        </span>
        <ChevronDown 
          size={14} 
          className={cn(
            "text-gray-400 transition-transform duration-300", 
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {locales.map((code) => (
              <button
                key={code}
                onClick={() => switchTo(code)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold transition-all duration-200",
                  code === locale 
                    ? "text-black bg-gray-50/80" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-black"
                )}
                role="menuitem"
                disabled={isPending}
              >
                <span>{localeLabels[code].native}</span>
                {code === locale && (
                  <Check size={16} strokeWidth={3} className="text-black" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

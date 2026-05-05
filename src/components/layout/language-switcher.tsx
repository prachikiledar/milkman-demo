"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Check, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const locales = ["en", "hi", "pa"];

const localeLabels: Record<string, { short: string; full: string; native: string }> = {
  en: { short: "EN", full: "English", native: "English" },
  hi: { short: "हिं", full: "Hindi", native: "हिंदी" },
  pa: { short: "ਪੰ", full: "Punjabi", native: "ਪੰਜਾਬੀ" },
};

/**
 * Compact, mobile-friendly language selector dropdown.
 * - Collapsed state shows only the active language code.
 * - Opens a dropdown with full language names on click.
 */
export function LanguageSwitcher({ locale: initialLocale }: { locale?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchTo = (nextLocale: string) => {
    if (nextLocale === locale) {
      setIsOpen(false);
      return;
    }

    startTransition(() => {
      const segments = pathname.split("/");
      segments[1] = nextLocale;
      router.push(segments.join("/"));
      setIsOpen(false);
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm transition-all active:scale-95",
          isOpen && "border-blue-200 ring-4 ring-blue-50"
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="h-4 w-4 text-gray-400" />
        <span className="text-[13px] font-black text-gray-900">
          {localeLabels[locale]?.short || locale.toUpperCase()}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
          {locales.map((code) => {
            const isActive = code === locale;
            return (
              <button
                key={code}
                onClick={() => switchTo(code)}
                disabled={isPending}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
                  isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-black">{localeLabels[code].native}</span>
                  <span className="text-[10px] font-bold opacity-60 uppercase">{localeLabels[code].full}</span>
                </div>
                {isActive && <Check className="h-4 w-4" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

export function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    // Placeholder to prevent layout shift before hydration
    return (
      <div className="flex items-baseline gap-1 mb-10 opacity-0">
        <div className="text-[64px] font-black tracking-tighter leading-none tabular-nums text-white">
          00:00
        </div>
        <div className="text-[32px] font-bold tracking-tighter text-green-400/90 mb-1">
          <span className="mr-0.5">:</span>00
        </div>
      </div>
    );
  }

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className="flex items-baseline gap-1 mb-10">
      <div className="text-[64px] font-black tracking-tighter leading-none tabular-nums text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
        {hours}:{minutes}
      </div>
      <div className="text-[32px] font-bold tracking-tighter text-green-400/90 mb-1">
        <span className="animate-pulse mr-0.5">:</span>{seconds}
      </div>
    </div>
  );
}

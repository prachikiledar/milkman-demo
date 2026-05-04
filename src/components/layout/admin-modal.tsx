"use client";

import * as React from "react";
import { X } from "lucide-react";

type AdminModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AdminModal({ isOpen, onClose, title, children, footer }: AdminModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-[var(--admin-border)] bg-[var(--admin-panel)] shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-6 py-5 bg-white">
          <h2 className="text-xl font-bold tracking-tight text-[var(--admin-text)]">{title}</h2>
          <button
            onClick={onClose}
            className="admin-icon-button h-10 w-10 text-[var(--admin-muted)] hover:text-[var(--admin-text)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[85vh] overflow-y-auto px-6 py-6 bg-white">{children}</div>
        {footer ? (
          <div className="border-t border-[var(--admin-border)] px-6 py-4 bg-gray-50">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

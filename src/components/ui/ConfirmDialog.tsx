"use client";

import { useEffect, useRef } from "react";

import { dangerButtonClass, secondaryButtonClass } from "@/components/ui/styles";

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Replaces window.confirm(). The browser's own dialog works, but it looks like
// the operating system rather than the app, it cannot show any context beyond
// one line of text, and it blocks the whole page while open.
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  isBusy = false,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus starts on Cancel, not on the destructive button. Someone who opens
  // this by accident and hits Enter should not delete anything.
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    // z-60 puts it above the card modal, which sits at z-50: this dialog can
    // be opened from inside it.
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        // "alertdialog" rather than "dialog": it tells screen readers this
        // interrupts to ask something that matters.
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h2
          id="confirm-title"
          className="text-base font-semibold text-slate-900"
        >
          {title}
        </h2>

        <p id="confirm-message" className="mt-2 text-sm text-slate-600">
          {message}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={dangerButtonClass}
          >
            {isBusy ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

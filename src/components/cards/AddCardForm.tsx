"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { inputClass, secondaryButtonClass } from "@/components/ui/styles";
import { cardSchema } from "@/lib/validations";

export function AddCardForm({ columnId }: { columnId: string }) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function close() {
    setIsOpen(false);
    setTitle("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Only the title here. Description and due date are added later from the
    // card's detail modal: asking for everything up front would slow down the
    // thing people do most, which is jotting down a task quickly.
    const parsed = cardSchema.safeParse({ title });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);

    const response = await fetch(`/api/columns/${columnId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: parsed.data.title }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Could not add the card");
      return;
    }

    // The form stays open with an empty field so several cards can be typed
    // in a row, which is how people actually fill a column.
    setTitle("");
    router.refresh();
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-2 w-full rounded-md px-2 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-200 hover:text-slate-700"
      >
        + Add card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2" noValidate>
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Card title"
        maxLength={200}
        autoFocus
        disabled={isSubmitting}
        className={`${inputClass} mt-0`}
        aria-label="Card title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            close();
          }
        }}
      />

      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={secondaryButtonClass}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={close}
          disabled={isSubmitting}
          className={secondaryButtonClass}
        >
          Done
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { inputClass, secondaryButtonClass } from "@/components/ui/styles";
import { columnSchema } from "@/lib/validations";

export function AddColumnForm({ boardId }: { boardId: string }) {
  const router = useRouter();

  // The form starts collapsed as a single "+ Add column" button. Showing an
  // empty input permanently would compete for attention with the real columns.
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

    const parsed = columnSchema.safeParse({ title });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);

    const response = await fetch(`/api/boards/${boardId}/columns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Could not add the column");
      return;
    }

    close();
    router.refresh();
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-fit w-72 shrink-0 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-left text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
      >
        + Add column
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="h-fit w-72 shrink-0 rounded-lg bg-slate-100 p-3"
      noValidate
    >
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Column name"
        maxLength={50}
        autoFocus
        disabled={isSubmitting}
        className={`${inputClass} mt-0`}
        aria-label="Column name"
        // Escape cancels. Small detail, but it is what people expect from a
        // field that opened on top of something else.
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
          Cancel
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}

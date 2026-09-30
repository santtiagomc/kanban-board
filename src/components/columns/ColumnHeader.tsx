"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { inputClass, secondaryButtonClass } from "@/components/ui/styles";
import { columnSchema } from "@/lib/validations";

type Props = {
  id: string;
  title: string;
  // Used to disable the arrow that would move the column out of the board.
  isFirst: boolean;
  isLast: boolean;
  // Reordering needs the full list of columns, which only the parent knows,
  // so moving is handled there and passed down as callbacks.
  onMoveLeft: () => void;
  onMoveRight: () => void;
  isReordering: boolean;
};

export function ColumnHeader({
  id,
  title,
  isFirst,
  isLast,
  onMoveLeft,
  onMoveRight,
  isReordering,
}: Props) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = columnSchema.safeParse({ title: draftTitle });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsBusy(true);

    const response = await fetch(`/api/columns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setIsBusy(false);

    if (!response.ok) {
      setError("Could not rename the column");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${title}"? Its cards will be deleted too.`,
    );

    if (!confirmed) {
      return;
    }

    setIsBusy(true);

    const response = await fetch(`/api/columns/${id}`, { method: "DELETE" });

    setIsBusy(false);

    if (!response.ok) {
      setError("Could not delete the column");
      return;
    }

    router.refresh();
  }

  if (isEditing) {
    return (
      <form onSubmit={handleRename} className="mb-3" noValidate>
        <input
          type="text"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          maxLength={50}
          autoFocus
          disabled={isBusy}
          className={`${inputClass} mt-0`}
          aria-label="Column name"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setDraftTitle(title);
              setIsEditing(false);
              setError(null);
            }
          }}
        />

        <div className="mt-2 flex gap-2">
          <button
            type="submit"
            disabled={isBusy}
            className={secondaryButtonClass}
          >
            {isBusy ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setDraftTitle(title);
              setIsEditing(false);
              setError(null);
            }}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>
    );
  }

  const arrowClass =
    "rounded px-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 " +
    "disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-1">
        {/* The title is a button so it can be clicked to rename, which is
            faster than hunting for a separate "rename" control. */}
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          disabled={isBusy}
          className="min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-200"
          title="Click to rename"
        >
          {title}
        </button>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onMoveLeft}
            disabled={isFirst || isBusy || isReordering}
            className={arrowClass}
            aria-label={`Move ${title} left`}
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={onMoveRight}
            disabled={isLast || isBusy || isReordering}
            className={arrowClass}
            aria-label={`Move ${title} right`}
          >
            &rarr;
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isBusy || isReordering}
            className="rounded px-1.5 text-slate-400 hover:bg-red-100 hover:text-red-700 disabled:opacity-30"
            aria-label={`Delete ${title}`}
          >
            &times;
          </button>
        </div>
      </div>

      {error && <p className="mt-1 px-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

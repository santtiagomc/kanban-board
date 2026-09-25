"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  dangerButtonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui/styles";
import { boardSchema } from "@/lib/validations";

type Props = {
  id: string;
  title: string;
  // Already formatted by the server. Formatting a date in the browser can
  // produce different text than the server produced (different time zone),
  // and React complains about the mismatch when it hydrates the page.
  updatedLabel: string;
};

export function BoardListItem({ id, title, updatedLabel }: Props) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = boardSchema.safeParse({ title: draftTitle });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsBusy(true);

    const response = await fetch(`/api/boards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setIsBusy(false);

    if (!response.ok) {
      setError("Could not rename the board");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    // A plain browser confirm is enough here. Deleting a board also deletes
    // its columns and cards, so it deserves a stop-and-think moment.
    const confirmed = window.confirm(
      `Delete "${title}"? Its columns and cards will be deleted too.`,
    );

    if (!confirmed) {
      return;
    }

    setIsBusy(true);

    const response = await fetch(`/api/boards/${id}`, { method: "DELETE" });

    setIsBusy(false);

    if (!response.ok) {
      setError("Could not delete the board");
      return;
    }

    router.refresh();
  }

  if (isEditing) {
    return (
      <li className="rounded-lg border border-slate-200 bg-white p-4">
        <form onSubmit={handleRename} className="flex flex-col gap-2" noValidate>
          <input
            type="text"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            maxLength={100}
            autoFocus
            disabled={isBusy}
            className={`${inputClass} mt-0`}
            aria-label="Board name"
          />

          <div className="flex gap-2">
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
                // Discard the draft and restore the original title.
                setDraftTitle(title);
                setIsEditing(false);
                setError(null);
              }}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300">
      <div className="min-w-0">
        <Link
          href={`/boards/${id}`}
          className="block truncate font-medium text-slate-900 hover:underline"
        >
          {title}
        </Link>
        <p className="mt-0.5 text-xs text-slate-500">
          Updated {updatedLabel}
        </p>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          disabled={isBusy}
          className={secondaryButtonClass}
        >
          Rename
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isBusy}
          className={dangerButtonClass}
        >
          {isBusy ? "..." : "Delete"}
        </button>
      </div>
    </li>
  );
}

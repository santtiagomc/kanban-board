"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  buttonClass,
  dangerButtonClass,
  formErrorClass,
  inputClass,
  labelClass,
  secondaryButtonClass,
} from "@/components/ui/styles";
import { SubtaskList, type Subtask } from "@/components/cards/SubtaskList";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { apiDelete, apiGet, apiPatch } from "@/lib/api-client";
import { cardSchema } from "@/lib/validations";

type Props = {
  cardId: string;
  onClose: () => void;
};

// What GET /api/cards/:cardId returns. Dates travel as ISO strings over JSON.
type CardDetail = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  subtasks: Subtask[];
};

export function CardModal({ cardId, onClose }: Props) {
  const router = useRouter();

  // Starts as "loading" because the card is fetched when the modal opens.
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // <input type="date"> only speaks "YYYY-MM-DD", never a Date object.
  const [dueDate, setDueDate] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Fetches the card once, when the modal opens.
  useEffect(() => {
    // If the modal is closed before the response arrives, writing state on an
    // unmounted component is pointless. This flag makes the late response a
    // no-op instead.
    let cancelled = false;

    async function load() {
      const result = await apiGet<CardDetail>(`/api/cards/${cardId}`);

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setError(result.error);
        // Leaving isLoading true here would be the bug: a permanent
        // "Loading..." with no explanation. Failing IS finishing.
        setIsLoading(false);
        return;
      }

      const card = result.data;

      setTitle(card.title);
      setDescription(card.description ?? "");
      // The API sends an ISO instant ("2026-12-25T00:00:00.000Z"); the date
      // input wants just the first 10 characters.
      setDueDate(card.dueDate ? String(card.dueDate).slice(0, 10) : "");
      setSubtasks(card.subtasks ?? []);
      setIsLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [cardId]);

  // Escape closes the modal, which is what people expect from a dialog.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // While the confirmation dialog is open it owns Escape. Both listeners
      // are active at once, so without this check one key press would cancel
      // the delete AND close the card behind it.
      if (event.key === "Escape" && !isConfirmingDelete) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup: without removing the listener, every open modal would leave
    // one behind and they would pile up.
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isConfirmingDelete]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Empty strings become null: "" is not a description, it is the absence
    // of one, and the database should store NULL rather than empty text.
    const parsed = cardSchema.safeParse({
      title,
      description: description.trim() === "" ? null : description,
      dueDate: dueDate === "" ? null : dueDate,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsSaving(true);

    const result = await apiPatch(`/api/cards/${cardId}`, {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      dueDate: dueDate === "" ? null : dueDate,
    });

    setIsSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  async function handleDelete() {
    setIsConfirmingDelete(false);
    setIsSaving(true);

    const result = await apiDelete(`/api/cards/${cardId}`);

    setIsSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    // The backdrop: clicking outside the panel closes the modal.
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-20"
      onClick={onClose}
      role="presentation"
    >
      {/* stopPropagation keeps a click INSIDE the panel from reaching the
          backdrop above and closing the modal by accident. */}
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Card details"
      >
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4" noValidate>
            {error && <p className={formErrorClass}>{error}</p>}

            <div>
              <label htmlFor="card-title" className={labelClass}>
                Title
              </label>
              <input
                id="card-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                autoFocus
                disabled={isSaving}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="card-description" className={labelClass}>
                Description
              </label>
              <textarea
                id="card-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                maxLength={2000}
                disabled={isSaving}
                className={inputClass}
                placeholder="Add more detail..."
              />
            </div>

            <div>
              <label htmlFor="card-due" className={labelClass}>
                Due date
              </label>
              <input
                id="card-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={isSaving}
                className={inputClass}
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  disabled={isSaving}
                  className="mt-1 text-xs text-slate-500 underline underline-offset-2"
                >
                  Clear due date
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`${buttonClass} w-auto`}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isSaving}
                className={dangerButtonClass}
              >
                Delete
              </button>
            </div>
          </form>
        )}

        {/* Outside the form on purpose: SubtaskList has a form of its own, and
            a form inside another form is invalid HTML.

            Subtasks also save on their own, one request each, with no Save
            button involved. Ticking a box should not need confirming, and
            losing those ticks by closing with Cancel would be surprising. */}
        {!isLoading && (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <SubtaskList
              cardId={cardId}
              subtasks={subtasks}
              onSubtasksChange={(next) => {
                setSubtasks(next);
                // Keeps the board behind the modal in step: the card shows a
                // "2/5" counter that has just changed.
                router.refresh();
              }}
            />
          </div>
        )}

        {isConfirmingDelete && (
          <ConfirmDialog
            title="Delete card"
            message={`"${title}" and its subtasks will be deleted. This cannot be undone.`}
            isBusy={isSaving}
            onConfirm={handleDelete}
            onCancel={() => setIsConfirmingDelete(false)}
          />
        )}
      </div>
    </div>
  );
}

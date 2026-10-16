"use client";

import { useState } from "react";

import { SuggestSubtasks } from "@/components/cards/SuggestSubtasks";
import { inputClass, secondaryButtonClass } from "@/components/ui/styles";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";

export type Subtask = {
  id: string;
  title: string;
  done: boolean;
};

type Props = {
  cardId: string;
  subtasks: Subtask[];
  // The modal owns the list, so changes are reported upwards instead of
  // being kept here. That way the modal can also refresh the board behind it.
  onSubtasksChange: (next: Subtask[]) => void;
};

export function SubtaskList({ cardId, subtasks, onSubtasksChange }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  // Which subtask is being renamed, and the text being typed. Only one can be
  // edited at a time, so a single id and a single draft are enough.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doneCount = subtasks.filter((subtask) => subtask.done).length;
  const progress =
    subtasks.length === 0 ? 0 : (doneCount / subtasks.length) * 100;

  async function handleToggle(subtask: Subtask) {
    setError(null);
    setBusyId(subtask.id);

    // Only the field that changes is sent. The API leaves the title alone
    // because it arrives as undefined, which Prisma reads as "don't touch".
    const result = await apiPatch<Subtask>(`/api/subtasks/${subtask.id}`, {
      done: !subtask.done,
    });

    setBusyId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSubtasksChange(
      subtasks.map((item) => (item.id === subtask.id ? result.data : item)),
    );
  }

  function startEditing(subtask: Subtask) {
    setEditingId(subtask.id);
    setDraftTitle(subtask.title);
    setError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftTitle("");
  }

  async function handleRename(subtask: Subtask) {
    const title = draftTitle.trim();

    if (title === "" || title === subtask.title) {
      // Nothing typed, or nothing changed: no request worth making.
      cancelEditing();
      return;
    }

    setError(null);
    setBusyId(subtask.id);

    // Only the title is sent. The "done" flag arrives as undefined, so the
    // tick stays exactly as it was - renaming must not untick anything.
    const result = await apiPatch<Subtask>(`/api/subtasks/${subtask.id}`, {
      title,
    });

    setBusyId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSubtasksChange(
      subtasks.map((item) => (item.id === subtask.id ? result.data : item)),
    );

    cancelEditing();
  }

  async function handleDelete(subtask: Subtask) {
    setError(null);
    setBusyId(subtask.id);

    const result = await apiDelete(`/api/subtasks/${subtask.id}`);

    setBusyId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSubtasksChange(subtasks.filter((item) => item.id !== subtask.id));
  }

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const title = newTitle.trim();

    if (title === "") {
      return;
    }

    setIsAdding(true);

    // A list of one. The same endpoint takes several at a time, which is how
    // the AI suggestions get saved.
    const result = await apiPost<Subtask[]>(`/api/cards/${cardId}/subtasks`, {
      titles: [title],
    });

    setIsAdding(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // The API returns the whole updated list, so there is nothing to merge.
    onSubtasksChange(result.data);
    setNewTitle("");
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">Subtasks</h3>
        {subtasks.length > 0 && (
          <span className="text-xs text-slate-500">
            {doneCount} of {subtasks.length}
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        // A progress bar is decoration on its own: the "x of y" above carries
        // the same information in words.
        <div
          className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-slate-700 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <ul className="space-y-1">
        {subtasks.map((subtask) => (
          <li key={subtask.id} className="flex items-center gap-2">
            {/* A real checkbox, not a styled div: it is reachable with Tab,
                toggles with Space, and screen readers announce its state. */}
            <input
              type="checkbox"
              id={`subtask-${subtask.id}`}
              checked={subtask.done}
              onChange={() => handleToggle(subtask)}
              disabled={busyId === subtask.id || editingId === subtask.id}
              className="h-4 w-4 rounded border-slate-300"
            />

            {editingId === subtask.id ? (
              <input
                type="text"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                maxLength={200}
                autoFocus
                disabled={busyId === subtask.id}
                className={`${inputClass} mt-0 flex-1 py-1 text-sm`}
                aria-label="Subtask title"
                // Saving on blur too, so clicking elsewhere doesn't quietly
                // throw the edit away.
                onBlur={() => handleRename(subtask)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleRename(subtask);
                  }

                  if (event.key === "Escape") {
                    // The card modal listens for Escape on the window to
                    // close itself. Stopping the event here means Escape
                    // cancels the rename without closing the card behind it.
                    event.stopPropagation();
                    cancelEditing();
                  }
                }}
              />
            ) : (
              <>
                <label
                  htmlFor={`subtask-${subtask.id}`}
                  className={`flex-1 text-sm ${
                    subtask.done
                      ? "text-slate-400 line-through"
                      : "text-slate-700"
                  }`}
                >
                  {subtask.title}
                </label>

                {/* Renaming gets its own button instead of reusing a click on
                    the text: that click already belongs to the checkbox, and
                    taking it away would cost more than it gives. */}
                <button
                  type="button"
                  onClick={() => startEditing(subtask)}
                  disabled={busyId === subtask.id}
                  className="rounded px-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30"
                  aria-label={`Rename subtask ${subtask.title}`}
                  title="Rename"
                >
                  &#9998;
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(subtask)}
                  disabled={busyId === subtask.id}
                  className="rounded px-1.5 text-slate-400 hover:bg-red-100 hover:text-red-700 disabled:opacity-30"
                  aria-label={`Delete subtask ${subtask.title}`}
                >
                  &times;
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {subtasks.length === 0 && (
        <p className="text-sm text-slate-400">No subtasks yet.</p>
      )}

      {/* This has its own <form> so Enter submits it. That is also why the
          modal renders this component OUTSIDE the card's form: a form nested
          inside another form is invalid HTML and browsers handle it badly. */}
      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a subtask"
          maxLength={200}
          disabled={isAdding}
          className={`${inputClass} mt-0`}
          aria-label="New subtask"
        />
        <button
          type="submit"
          disabled={isAdding || newTitle.trim() === ""}
          className={`${secondaryButtonClass} shrink-0`}
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Accepted suggestions come back as the full updated list, the same
          shape the manual form returns, so it plugs in here unchanged. */}
      <SuggestSubtasks cardId={cardId} onAccepted={onSubtasksChange} />
    </section>
  );
}

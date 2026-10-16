"use client";

import { useState } from "react";

import { secondaryButtonClass } from "@/components/ui/styles";
import { apiPost } from "@/lib/api-client";

import type { Subtask } from "./SubtaskList";

type Props = {
  cardId: string;
  onAccepted: (subtasks: Subtask[]) => void;
};

export function SuggestSubtasks({ cardId, onAccepted }: Props) {
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  // Which suggestions are ticked. Set, not array: checking membership and
  // toggling are both one line.
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    setError(null);
    setIsLoading(true);

    const result = await apiPost<{ suggestions: string[] }>(
      `/api/cards/${cardId}/suggest-subtasks`,
      {},
    );

    setIsLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuggestions(result.data.suggestions);
    // All ticked to begin with: accepting everything is the common case, and
    // unticking the odd one out is less work than ticking four.
    setSelected(new Set(result.data.suggestions.map((_, index) => index)));
  }

  function toggle(index: number) {
    setSelected((previous) => {
      const next = new Set(previous);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  }

  async function handleAccept() {
    if (!suggestions) {
      return;
    }

    // Keep the original order, not the order they were ticked in.
    const titles = suggestions.filter((_, index) => selected.has(index));

    if (titles.length === 0) {
      return;
    }

    setError(null);
    setIsSaving(true);

    // The same endpoint the manual form uses. Nothing about these subtasks is
    // special once accepted: they are ordinary rows.
    const result = await apiPost<Subtask[]>(`/api/cards/${cardId}/subtasks`, {
      titles,
    });

    setIsSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onAccepted(result.data);
    setSuggestions(null);
    setSelected(new Set());
  }

  function discard() {
    setSuggestions(null);
    setSelected(new Set());
    setError(null);
  }

  // --- Nothing suggested yet: just the button -------------------------------
  if (!suggestions) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={handleSuggest}
          disabled={isLoading}
          className={secondaryButtonClass}
        >
          {isLoading ? "Thinking..." : "Suggest subtasks"}
        </button>

        {/* The model takes a few seconds. Saying so costs one line and keeps
            the wait from reading as a frozen button - the cheapest fix for
            slowness you cannot remove. */}
        {isLoading && (
          <p className="mt-2 text-xs text-slate-500">
            This usually takes a few seconds.
          </p>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // --- Suggestions on screen, waiting to be accepted or discarded ----------
  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs text-slate-500">
        Suggestions. Untick anything you don&apos;t want, then add them.
      </p>

      <ul className="space-y-1">
        {suggestions.map((suggestion, index) => (
          <li key={suggestion} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`suggestion-${index}`}
              checked={selected.has(index)}
              onChange={() => toggle(index)}
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label
              htmlFor={`suggestion-${index}`}
              className="flex-1 text-sm text-slate-700"
            >
              {suggestion}
            </label>
          </li>
        ))}
      </ul>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isSaving || selected.size === 0}
          className={secondaryButtonClass}
        >
          {isSaving ? "Adding..." : `Add ${selected.size}`}
        </button>
        <button
          type="button"
          onClick={discard}
          disabled={isSaving}
          className={secondaryButtonClass}
        >
          Discard
        </button>
      </div>
    </div>
  );
}

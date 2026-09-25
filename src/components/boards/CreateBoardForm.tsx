"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonClass, formErrorClass, inputClass } from "@/components/ui/styles";
import { boardSchema } from "@/lib/validations";

export function CreateBoardForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Same schema the API uses, so an empty title is caught before the trip.
    const parsed = boardSchema.safeParse({ title });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Could not create the board");
      return;
    }

    setTitle("");

    // Ask the server to re-render this page. It queries the database again and
    // sends fresh HTML, so the new board shows up without keeping a second
    // copy of the list in browser state.
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8" noValidate>
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New board name"
          maxLength={100}
          disabled={isSubmitting}
          className={`${inputClass} mt-0`}
          aria-label="New board name"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${buttonClass} w-auto whitespace-nowrap`}
        >
          {isSubmitting ? "Creating..." : "Create board"}
        </button>
      </div>

      {error && <p className={`${formErrorClass} mt-2`}>{error}</p>}
    </form>
  );
}

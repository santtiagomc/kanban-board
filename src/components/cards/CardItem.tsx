"use client";

export type CardView = {
  id: string;
  title: string;
  // The page sends these already worked out, rather than the raw date:
  //   - formatting on the server avoids a hydration mismatch (the browser's
  //     time zone can format the same instant differently)
  //   - "overdue" depends on the current time, so it is decided in one place
  dueLabel: string | null;
  isOverdue: boolean;
  hasDescription: boolean;
};

export function CardItem({
  card,
  onOpen,
}: {
  card: CardView;
  onOpen: () => void;
}) {
  return (
    // A <button>, not a <div> with onClick: it is focusable with Tab and
    // responds to Enter and Space for free. A clickable div is invisible to
    // anyone navigating by keyboard.
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-left shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
    >
      <p className="text-sm text-slate-800">{card.title}</p>

      {(card.dueLabel || card.hasDescription) && (
        <div className="mt-2 flex items-center gap-2">
          {card.dueLabel && (
            <span
              className={
                card.isOverdue
                  ? "rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700"
                  : "rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
              }
              // Colour alone shouldn't carry meaning: someone who can't
              // distinguish red needs the wording too.
              title={card.isOverdue ? "Overdue" : "Due date"}
            >
              {card.isOverdue ? "Overdue " : "Due "}
              {card.dueLabel}
            </span>
          )}

          {card.hasDescription && (
            <span className="text-xs text-slate-400" title="Has a description">
              &#9776;
            </span>
          )}
        </div>
      )}
    </button>
  );
}

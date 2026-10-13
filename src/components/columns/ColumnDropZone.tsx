"use client";

import { useDroppable } from "@dnd-kit/core";

type Props = {
  columnId: string;
  children: React.ReactNode;
};

// The area of a column that accepts dropped cards.
//
// Without this, an EMPTY column would be impossible to drop into: dnd-kit
// works out the target from whatever is under the cursor, and an empty column
// has no cards to hover over. This gives it something to hover over.
//
// The "column:" prefix is how the drop handler tells the two kinds of target
// apart: an id that starts with it is a column, anything else is a card.
export function ColumnDropZone({ columnId, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${columnId}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-16 flex-col gap-2 rounded-md transition-colors ${
        isOver ? "bg-slate-200" : ""
      }`}
    >
      {children}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AddCardForm } from "@/components/cards/AddCardForm";
import { CardItem, type CardView } from "@/components/cards/CardItem";
import { AddColumnForm } from "@/components/columns/AddColumnForm";
import { ColumnHeader } from "@/components/columns/ColumnHeader";

type Column = {
  id: string;
  title: string;
  cards: CardView[];
};

type Props = {
  boardId: string;
  // Already sorted by position on the server.
  columns: Column[];
};

// Holds the whole list of columns, because reordering needs to know all of
// them: the API expects the complete list of ids in their new order, not
// "move this one to position 2".
export function BoardColumns({ boardId, columns }: Props) {
  const router = useRouter();

  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    // Guard against moving past either end. The buttons are disabled at the
    // edges too, but a check here means the logic is safe on its own.
    if (targetIndex < 0 || targetIndex >= columns.length) {
      return;
    }

    const orderedIds = columns.map((column) => column.id);

    // Swap the two ids. This destructuring swap avoids a temporary variable.
    [orderedIds[index], orderedIds[targetIndex]] = [
      orderedIds[targetIndex],
      orderedIds[index],
    ];

    setError(null);
    setIsReordering(true);

    const response = await fetch(`/api/boards/${boardId}/columns/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });

    setIsReordering(false);

    if (!response.ok) {
      setError("Could not reorder the columns");
      return;
    }

    // The new order is not applied locally: router.refresh() brings it back
    // from the database. Slightly slower, but the screen always shows what is
    // actually stored. Phase 7 revisits this for drag and drop, where waiting
    // for the server would feel wrong.
    router.refresh();
  }

  return (
    <>
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Horizontal scroll: with many columns the board should scroll
          sideways instead of squeezing them. */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column, index) => (
          <section
            key={column.id}
            className="flex w-72 shrink-0 flex-col rounded-lg bg-slate-100 p-3"
          >
            <ColumnHeader
              id={column.id}
              title={column.title}
              isFirst={index === 0}
              isLast={index === columns.length - 1}
              onMoveLeft={() => move(index, -1)}
              onMoveRight={() => move(index, 1)}
              isReordering={isReordering}
            />

            <div className="flex flex-col gap-2">
              {column.cards.map((card) => (
                <CardItem key={card.id} card={card} />
              ))}
            </div>

            {column.cards.length === 0 && (
              <p className="px-1 py-2 text-sm text-slate-400">No cards yet</p>
            )}

            <AddCardForm columnId={column.id} />
          </section>
        ))}

        <AddColumnForm boardId={boardId} />
      </div>
    </>
  );
}

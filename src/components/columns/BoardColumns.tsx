"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { AddCardForm } from "@/components/cards/AddCardForm";
import { CardItem, type CardView } from "@/components/cards/CardItem";
import { CardModal } from "@/components/cards/CardModal";
import { SortableCard } from "@/components/cards/SortableCard";
import { AddColumnForm } from "@/components/columns/AddColumnForm";
import { ColumnDropZone } from "@/components/columns/ColumnDropZone";
import { ColumnHeader } from "@/components/columns/ColumnHeader";
import { apiPatch } from "@/lib/api-client";

type Column = {
  id: string;
  title: string;
  cards: CardView[];
};

type Props = {
  boardId: string;
  columns: Column[];
};

// --- Small helpers, kept outside the component so they are easy to read ---

function findColumnIdByCard(columns: Column[], cardId: string) {
  return columns.find((column) =>
    column.cards.some((card) => card.id === cardId),
  )?.id;
}

// A drop target is either a column ("column:abc") or a card ("abc").
function resolveTargetColumnId(columns: Column[], overId: string) {
  if (overId.startsWith("column:")) {
    return overId.slice("column:".length);
  }

  return findColumnIdByCard(columns, overId);
}

export function BoardColumns({ boardId, columns: columnsFromServer }: Props) {
  const router = useRouter();

  // --- Local copy of the board ---------------------------------------------
  // Until this phase the columns were rendered straight from the props. Drag
  // and drop needs the card to move the instant it is dropped, which means
  // keeping an editable copy here and reconciling it with the server later.
  const [columns, setColumns] = useState(columnsFromServer);

  // Whenever fresh data arrives from the server (after router.refresh()), it
  // wins: the server is the source of truth, the local copy is just a
  // temporary preview.
  //
  // This is React's "adjusting state when a prop changes" pattern, and it
  // belongs HERE, during render, not inside an effect. An effect runs after
  // the screen has been painted, so it would render once with the stale local
  // copy and then again with the new data - two renders and a possible flash.
  // Done this way, React notices the setState and re-runs this component
  // before anything reaches the screen.
  const [lastServerColumns, setLastServerColumns] = useState(columnsFromServer);

  if (columnsFromServer !== lastServerColumns) {
    setLastServerColumns(columnsFromServer);
    setColumns(columnsFromServer);
  }

  // What the board looked like before the drag started, so a rejected move
  // can be undone. A ref, not state: changing it must not cause a re-render.
  const snapshotRef = useRef<Column[]>(columnsFromServer);

  const [activeCard, setActiveCard] = useState<CardView | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Dragging only starts after the pointer moves 8px. Without this, every
      // click would count as a tiny drag and opening a card would break.
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      // Keyboard dragging, for free: Space picks a card up, the arrow keys
      // move it, Space drops it. Worth keeping - a mouse-only board excludes
      // anyone who can't use one.
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const cardId = String(event.active.id);

    snapshotRef.current = columns;
    setError(null);

    const card = columns
      .flatMap((column) => column.cards)
      .find((item) => item.id === cardId);

    setActiveCard(card ?? null);
  }

  // Runs continuously while dragging. Its only job is moving the card between
  // columns as you hover, so the gap opens up where the card would land.
  // Reordering INSIDE a column is left to handleDragEnd.
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const cardId = String(active.id);
    const overId = String(over.id);

    const fromColumnId = findColumnIdByCard(columns, cardId);
    const toColumnId = resolveTargetColumnId(columns, overId);

    if (!fromColumnId || !toColumnId || fromColumnId === toColumnId) {
      return;
    }

    setColumns((previous) => {
      const card = previous
        .flatMap((column) => column.cards)
        .find((item) => item.id === cardId);

      if (!card) {
        return previous;
      }

      return previous.map((column) => {
        if (column.id === fromColumnId) {
          return {
            ...column,
            cards: column.cards.filter((item) => item.id !== cardId),
          };
        }

        if (column.id === toColumnId) {
          // Drop it where the cursor is: above the card being hovered, or at
          // the end when hovering the empty part of the column.
          const overIndex = column.cards.findIndex(
            (item) => item.id === overId,
          );

          const insertAt = overIndex === -1 ? column.cards.length : overIndex;
          const nextCards = [...column.cards];
          nextCards.splice(insertAt, 0, card);

          return { ...column, cards: nextCards };
        }

        return column;
      });
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveCard(null);

    if (!over) {
      // Dropped outside any target: undo whatever handleDragOver previewed.
      setColumns(snapshotRef.current);
      return;
    }

    const cardId = String(active.id);
    const overId = String(over.id);

    const columnId = findColumnIdByCard(columns, cardId);

    if (!columnId) {
      return;
    }

    // Final ordering inside the destination column.
    let nextColumns = columns;
    const targetColumn = columns.find((column) => column.id === columnId);

    if (targetColumn) {
      const oldIndex = targetColumn.cards.findIndex(
        (item) => item.id === cardId,
      );
      const overIndex = targetColumn.cards.findIndex(
        (item) => item.id === overId,
      );

      if (overIndex !== -1 && oldIndex !== overIndex) {
        nextColumns = columns.map((column) =>
          column.id === columnId
            ? { ...column, cards: arrayMove(column.cards, oldIndex, overIndex) }
            : column,
        );

        setColumns(nextColumns);
      }
    }

    // Did anything actually change? Dropping a card back where it started is
    // common, and there is no reason to ask the server to rewrite the same
    // positions.
    const snapshot = snapshotRef.current;
    const previousColumnId = findColumnIdByCard(snapshot, cardId);
    const previousIndex = snapshot
      .find((column) => column.id === previousColumnId)
      ?.cards.findIndex((item) => item.id === cardId);
    const newIndex = nextColumns
      .find((column) => column.id === columnId)
      ?.cards.findIndex((item) => item.id === cardId);

    if (previousColumnId === columnId && previousIndex === newIndex) {
      return;
    }

    // --- The optimistic part -------------------------------------------------
    // The screen already shows the card in its new place. Now we tell the
    // server, and only deal with it if it says no.
    setIsReordering(true);

    const orderedIds =
      nextColumns
        .find((column) => column.id === columnId)
        ?.cards.map((card) => card.id) ?? [];

    // apiPatch never throws: a server that is down and a server that says no
    // both come back as { ok: false }. Handling only one of those was a real
    // bug here - with the server stopped, the card stayed where it was
    // dropped as if it had been saved.
    const result = await apiPatch(
      `/api/columns/${columnId}/cards/reorder`,
      { orderedIds },
    );

    setIsReordering(false);

    if (!result.ok) {
      // Put the board back the way it was and say so. This is the price of
      // being optimistic: for a moment the screen showed something untrue.
      setColumns(snapshot);
      setError(`${result.error} The card has been put back.`);
      return;
    }

    // Accepted: ask the server for the real state. It should match what is
    // already on screen, so nothing visibly changes.
    router.refresh();
  }

  async function moveColumn(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= columns.length) {
      return;
    }

    const orderedIds = columns.map((column) => column.id);

    [orderedIds[index], orderedIds[targetIndex]] = [
      orderedIds[targetIndex],
      orderedIds[index],
    ];

    setError(null);
    setIsReordering(true);

    const result = await apiPatch(`/api/boards/${boardId}/columns/reorder`, {
      orderedIds,
    });

    setIsReordering(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <>
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        // closestCorners works better than closestCenter for lists: when a
        // card is hovering between two others, the corners tell them apart
        // more reliably.
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
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
                onMoveLeft={() => moveColumn(index, -1)}
                onMoveRight={() => moveColumn(index, 1)}
                isReordering={isReordering}
              />

              <ColumnDropZone columnId={column.id}>
                {/* SortableContext tells dnd-kit which items form this list
                    and in what order. One per column. */}
                <SortableContext
                  items={column.cards.map((card) => card.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {column.cards.map((card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      onOpen={() => setOpenCardId(card.id)}
                    />
                  ))}
                </SortableContext>

                {column.cards.length === 0 && (
                  <p className="px-1 py-2 text-sm text-slate-400">
                    Drop cards here
                  </p>
                )}
              </ColumnDropZone>

              <AddCardForm columnId={column.id} />
            </section>
          ))}

          <AddColumnForm boardId={boardId} />
        </div>

        {/* The copy that follows the cursor. Rendering it outside the columns
            keeps it from being clipped by their scrollbars. */}
        <DragOverlay>
          {activeCard && (
            <div className="rotate-2 cursor-grabbing opacity-90 shadow-lg">
              <CardItem card={activeCard} onOpen={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {openCardId && (
        <CardModal cardId={openCardId} onClose={() => setOpenCardId(null)} />
      )}
    </>
  );
}

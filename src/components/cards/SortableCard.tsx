"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { CardItem, type CardView } from "@/components/cards/CardItem";

type Props = {
  card: CardView;
  onOpen: () => void;
};

// Wraps a card so it can be dragged. The card itself (CardItem) knows nothing
// about dragging: it only renders. Keeping the two apart means the visual
// design and the drag behaviour can change independently.
//
// TODO: adapt this to the device. With a mouse, grabbing the card anywhere is
// nicer than aiming at a small handle; on a touch screen the handle is the
// only thing that works. A plain CSS media query cannot do it: which element
// carries the drag listeners is decided in JavaScript, not in CSS. The piece
// to use is its JS counterpart:
//
//   const coarse = window.matchMedia("(pointer: coarse)").matches;
//
// "(pointer: coarse)" asks about the pointing device rather than the screen
// width - a touch laptop is coarse at 1440px, and a phone in landscape is
// still coarse. Width is the wrong question here.
//
// Then: listeners on the wrapper when it is a mouse, on the handle when it is
// touch, and show the handle only in the second case. It needs testing on
// both kinds of device, which is why it was left out for now.
export function SortableCard({ card, onOpen }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        // While dragging, dnd-kit reports how far the element has moved and
        // this turns it into a CSS transform. Transforms don't trigger layout
        // recalculation, which is why dragging stays smooth.
        transform: CSS.Transform.toString(transform),
        transition,
        // The original keeps its place as a faded outline; the copy that
        // follows the cursor is drawn by DragOverlay.
        opacity: isDragging ? 0.4 : 1,
      }}
      className="flex items-center gap-1"
    >
      <div className="min-w-0 flex-1">
        <CardItem card={card} onOpen={onOpen} />
      </div>

      {/* The drag handle. On a mouse the whole card could be draggable, but on
          a touch screen dragging a finger already means "scroll the page", and
          the browser gives that gesture to the scroller. touchAction: "none"
          claims it for dragging instead - and that is exactly why it is on
          this small strip and not on the card: otherwise scrolling a column
          full of cards would become impossible, since the cards cover nearly
          all of it.

          It is a <button>, so dnd-kit's keyboard dragging still reaches it
          with Tab. */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        style={{ touchAction: "none" }}
        className="shrink-0 cursor-grab touch-none rounded px-1.5 py-3 text-slate-300 hover:bg-slate-200 hover:text-slate-500 active:cursor-grabbing"
        aria-label={`Drag ${card.title}`}
        title="Drag to move"
      >
        {/* Six dots: the usual symbol for "grab me". */}
        &#x2059;
      </button>
    </div>
  );
}

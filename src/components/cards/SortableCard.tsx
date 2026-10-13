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
      // These spread props are what make the element draggable, by mouse,
      // touch and keyboard alike.
      {...attributes}
      {...listeners}
    >
      <CardItem card={card} onOpen={onOpen} />
    </div>
  );
}

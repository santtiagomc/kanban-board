// Business logic for cards.
//
// Ownership is now two relations deep: a card belongs to a column, the column
// belongs to a board, and the board has an owner:
//
//   where: { id: cardId, column: { board: { ownerId: userId } } }
//
// Prisma turns that into two JOINs and it is still a single query.

import { prisma } from "@/lib/prisma";
import type { CardInput } from "@/lib/validations";

async function findOwnedColumn(columnId: string, userId: string) {
  return prisma.column.findFirst({
    where: { id: columnId, board: { ownerId: userId } },
    select: { id: true, boardId: true },
  });
}

async function isCardOwnedBy(cardId: string, userId: string) {
  const card = await prisma.card.findFirst({
    where: { id: cardId, column: { board: { ownerId: userId } } },
    select: { id: true },
  });

  return card !== null;
}

// Adds a card at the bottom of the column. Returns null when the column isn't
// the user's.
export async function createCard(
  columnId: string,
  userId: string,
  input: CardInput,
) {
  const column = await findOwnedColumn(columnId, userId);

  if (!column) {
    return null;
  }

  const lastCard = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  return prisma.card.create({
    data: {
      title: input.title,
      // The schema allows undefined ("not sent") and null ("clear it").
      // Prisma treats undefined as "leave alone", so for a brand new card
      // both end up as NULL in the database anyway.
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      position: lastCard ? lastCard.position + 1 : 0,
      columnId,
    },
  });
}

// Returns the updated card, or null when it isn't the user's.
export async function updateCard(
  cardId: string,
  userId: string,
  input: CardInput,
) {
  if (!(await isCardOwnedBy(cardId, userId))) {
    return null;
  }

  return prisma.card.update({
    where: { id: cardId },
    data: {
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
    },
  });
}

export async function deleteCard(cardId: string, userId: string) {
  if (!(await isCardOwnedBy(cardId, userId))) {
    return false;
  }

  await prisma.card.delete({ where: { id: cardId } });

  return true;
}

// Sets which cards live in a column, and in what order.
//
// This single function covers both cases:
//   - reordering inside a column: every id already belongs to it
//   - moving a card from another column: that id changes columnId here
//
// The source column needs no call of its own: once the card points at the new
// column, it is simply no longer part of the old one. The positions left
// behind may have gaps, which is fine (see columns.ts).
//
// Returns "not-found", "mismatch" or "ok".
export async function setColumnCards(
  columnId: string,
  userId: string,
  orderedIds: string[],
) {
  const column = await findOwnedColumn(columnId, userId);

  if (!column) {
    return "not-found" as const;
  }

  // Same id twice would make the result depend on which update ran last.
  if (new Set(orderedIds).size !== orderedIds.length) {
    return "mismatch" as const;
  }

  // Every card must belong to THIS board. Without this check a caller could
  // drag a card out of somebody else's board into their own - or just send
  // ids that don't exist.
  const cards = await prisma.card.findMany({
    where: {
      id: { in: orderedIds },
      column: { boardId: column.boardId },
    },
    select: { id: true },
  });

  if (cards.length !== orderedIds.length) {
    return "mismatch" as const;
  }

  // The list must also include every card ALREADY in this column. A card can
  // only leave by being listed in another column's request, so anything
  // currently here and missing from the list would keep its old position and
  // end up sharing a position with a newly placed card - leaving the order
  // undefined.
  const cardsAlreadyHere = await prisma.card.findMany({
    where: { columnId },
    select: { id: true },
  });

  const received = new Set(orderedIds);
  const allAccountedFor = cardsAlreadyHere.every((card) =>
    received.has(card.id),
  );

  if (!allAccountedFor) {
    return "mismatch" as const;
  }

  // One transaction: either every card ends up in its new place, or none
  // moves at all.
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.card.update({
        where: { id },
        data: { columnId, position: index },
      }),
    ),
  );

  return "ok" as const;
}

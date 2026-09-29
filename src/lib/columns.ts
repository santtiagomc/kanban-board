// Business logic for columns.
//
// A column has no ownerId of its own: it belongs to a board, and the board has
// an owner. So every query walks that relation:
//
//   where: { id: columnId, board: { ownerId: userId } }
//
// Prisma turns that nested `board` filter into a JOIN, so "does it exist?" and
// "is it theirs?" are still answered by a single query.

import { prisma } from "@/lib/prisma";

async function isBoardOwnedBy(boardId: string, userId: string) {
  const board = await prisma.board.findFirst({
    where: { id: boardId, ownerId: userId },
    select: { id: true },
  });

  return board !== null;
}

async function isColumnOwnedBy(columnId: string, userId: string) {
  const column = await prisma.column.findFirst({
    where: { id: columnId, board: { ownerId: userId } },
    select: { id: true },
  });

  return column !== null;
}

// Adds a column at the end of the board. Returns null when the board isn't
// the user's.
export async function createColumn(
  boardId: string,
  userId: string,
  title: string,
) {
  if (!(await isBoardOwnedBy(boardId, userId))) {
    return null;
  }

  // Find the highest position currently in use and go one past it.
  // Note this reads the last position and then writes, so two columns created
  // at the exact same instant could land on the same number. Harmless here:
  // positions only decide the order, and reordering rewrites them all anyway.
  const lastColumn = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const position = lastColumn ? lastColumn.position + 1 : 0;

  return prisma.column.create({
    data: { title, position, boardId },
  });
}

export async function renameColumn(
  columnId: string,
  userId: string,
  title: string,
) {
  if (!(await isColumnOwnedBy(columnId, userId))) {
    return null;
  }

  return prisma.column.update({
    where: { id: columnId },
    data: { title },
  });
}

// Deletes the column and, through onDelete: Cascade, its cards and subtasks.
//
// The remaining positions are NOT renumbered. Deleting the column at position 1
// leaves 0, 2, 3 - and that is fine: positions are only used for ORDER BY, so
// they need to be in the right order, not consecutive.
export async function deleteColumn(columnId: string, userId: string) {
  if (!(await isColumnOwnedBy(columnId, userId))) {
    return false;
  }

  await prisma.column.delete({ where: { id: columnId } });

  return true;
}

// Rewrites the position of every column on the board.
//
// Returns:
//   "not-found" -> the board isn't the user's (or doesn't exist)
//   "mismatch"  -> the ids sent don't match the board's columns exactly
//   "ok"        -> reordered
export async function reorderColumns(
  boardId: string,
  userId: string,
  orderedIds: string[],
) {
  if (!(await isBoardOwnedBy(boardId, userId))) {
    return "not-found" as const;
  }

  const columns = await prisma.column.findMany({
    where: { boardId },
    select: { id: true },
  });

  // The request must list exactly the board's columns: no missing ones, no
  // duplicates, and no ids from another board. Without this check, a caller
  // could sneak in a foreign column id and we would try to update it.
  const currentIds = new Set(columns.map((column) => column.id));
  const receivedIds = new Set(orderedIds);

  const sameSize =
    currentIds.size === receivedIds.size &&
    receivedIds.size === orderedIds.length;

  const sameIds =
    sameSize && orderedIds.every((id) => currentIds.has(id));

  if (!sameIds) {
    return "mismatch" as const;
  }

  // All the updates run as ONE transaction: either every position is written
  // or none is. Updating them one by one could leave the board half-reordered
  // if something failed midway.
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.column.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  return "ok" as const;
}

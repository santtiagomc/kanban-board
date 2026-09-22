// Business logic for boards. Both the API routes and the server-rendered pages
// call these functions, so the rules live in exactly one place.
//
// SECURITY RULE: every function takes the current userId and filters by it.
// A query that filters only by board id would let anyone read or change a
// board just by guessing its id. There is no function here that skips the
// owner check, on purpose.

import { prisma } from "@/lib/prisma";

// Every new board starts with these columns, in this order.
export const DEFAULT_COLUMNS = ["To do", "In progress", "Done"];

export function getBoardsForUser(userId: string) {
  return prisma.board.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" }, // newest first
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
}

// Returns the board with its columns, or null if it doesn't exist OR belongs
// to someone else. Callers can't tell those two cases apart, which is exactly
// what we want: both become a 404.
export function getBoardForUser(boardId: string, userId: string) {
  return prisma.board.findFirst({
    where: { id: boardId, ownerId: userId },
    include: {
      // Without orderBy, Postgres may return columns in any order.
      columns: { orderBy: { position: "asc" } },
    },
  });
}

export function createBoard(userId: string, title: string) {
  return prisma.board.create({
    data: {
      title,
      ownerId: userId,
      // Nested write: the board and its columns are created in one
      // transaction. Either everything is saved or nothing is, so a board can
      // never end up half-created without its columns.
      columns: {
        create: DEFAULT_COLUMNS.map((columnTitle, index) => ({
          title: columnTitle,
          position: index,
        })),
      },
    },
    include: {
      columns: { orderBy: { position: "asc" } },
    },
  });
}

// Checks ownership without loading the whole board. Kept private: it's a
// building block for the functions below, not something routes should call.
async function isBoardOwnedBy(boardId: string, userId: string) {
  const board = await prisma.board.findFirst({
    where: { id: boardId, ownerId: userId },
    select: { id: true },
  });

  return board !== null;
}

// Returns the updated board, or null when it isn't the user's.
export async function renameBoard(
  boardId: string,
  userId: string,
  title: string,
) {
  if (!(await isBoardOwnedBy(boardId, userId))) {
    return null;
  }

  return prisma.board.update({
    where: { id: boardId },
    data: { title },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
}

// Returns true if the board was deleted, false when it isn't the user's.
// Its columns, cards and subtasks go too, thanks to onDelete: Cascade in the
// schema. Postgres handles that; no extra code needed here.
export async function deleteBoard(boardId: string, userId: string) {
  if (!(await isBoardOwnedBy(boardId, userId))) {
    return false;
  }

  await prisma.board.delete({ where: { id: boardId } });

  return true;
}

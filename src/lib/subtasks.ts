// Business logic for subtasks.
//
// The ownership chain reaches its full depth here - three nested relations:
//
//   where: { id, card: { column: { board: { ownerId: userId } } } }
//
// Subtask -> Card -> Column -> Board -> owner. Prisma turns it into three
// JOINs and it is still one query.

import { prisma } from "@/lib/prisma";
import type { UpdateSubtaskInput } from "@/lib/validations";

async function isCardOwnedBy(cardId: string, userId: string) {
  const card = await prisma.card.findFirst({
    where: { id: cardId, column: { board: { ownerId: userId } } },
    select: { id: true },
  });

  return card !== null;
}

async function isSubtaskOwnedBy(subtaskId: string, userId: string) {
  const subtask = await prisma.subtask.findFirst({
    where: {
      id: subtaskId,
      card: { column: { board: { ownerId: userId } } },
    },
    select: { id: true },
  });

  return subtask !== null;
}

// Adds one or more subtasks to the end of the card's list.
// Returns null when the card isn't the user's.
export async function createSubtasks(
  cardId: string,
  userId: string,
  titles: string[],
) {
  if (!(await isCardOwnedBy(cardId, userId))) {
    return null;
  }

  const lastSubtask = await prisma.subtask.findFirst({
    where: { cardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const startPosition = lastSubtask ? lastSubtask.position + 1 : 0;

  // createMany inserts every row in one statement. Accepting five AI
  // suggestions is one trip to the database, not five.
  await prisma.subtask.createMany({
    data: titles.map((title, index) => ({
      title,
      position: startPosition + index,
      cardId,
    })),
  });

  // createMany does not return the created rows, so the fresh list is read
  // back for the caller.
  return prisma.subtask.findMany({
    where: { cardId },
    orderBy: { position: "asc" },
  });
}

export async function updateSubtask(
  subtaskId: string,
  userId: string,
  input: UpdateSubtaskInput,
) {
  if (!(await isSubtaskOwnedBy(subtaskId, userId))) {
    return null;
  }

  // Only the fields that were actually sent get written. Prisma treats
  // undefined as "leave this alone", so ticking a box never touches the
  // title and renaming never touches the checkbox.
  return prisma.subtask.update({
    where: { id: subtaskId },
    data: {
      title: input.title,
      done: input.done,
    },
  });
}

export async function deleteSubtask(subtaskId: string, userId: string) {
  if (!(await isSubtaskOwnedBy(subtaskId, userId))) {
    return false;
  }

  await prisma.subtask.delete({ where: { id: subtaskId } });

  return true;
}

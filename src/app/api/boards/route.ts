// GET  /api/boards - list the current user's boards
// POST /api/boards - create a board (with its default columns)
//
// Note the pattern every handler follows: who is asking -> is the input valid
// -> do the work in lib/ -> respond. This file only speaks HTTP; the actual
// rules live in src/lib/boards.ts.

import { getCurrentUserId, jsonError, readJson } from "@/lib/api-helpers";
import { createBoard, getBoardsForUser } from "@/lib/boards";
import { boardSchema } from "@/lib/validations";

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const boards = await getBoardsForUser(userId);

  return Response.json(boards);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const body = await readJson(request);

  if (body === undefined) {
    return jsonError("Invalid JSON body", 400);
  }

  const result = boardSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: "Invalid data", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const board = await createBoard(userId, result.data.title);

  return Response.json(board, { status: 201 });
}

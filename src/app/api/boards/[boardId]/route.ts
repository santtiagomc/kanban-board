// GET    /api/boards/:boardId - one board with its columns
// PATCH  /api/boards/:boardId - rename it
// DELETE /api/boards/:boardId - delete it (and everything inside)
//
// [boardId] in the folder name is a dynamic segment: it matches any value, and
// Next passes that value to the handler as params.boardId.

import { getCurrentUserId, jsonError, readJson } from "@/lib/api-helpers";
import { deleteBoard, getBoardForUser, renameBoard } from "@/lib/boards";
import { boardSchema } from "@/lib/validations";

// Since Next.js 15, params is a Promise and must be awaited. Many older
// examples read params.boardId directly, which no longer works.
type RouteContext = {
  params: Promise<{ boardId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const { boardId } = await params;
  const board = await getBoardForUser(boardId, userId);

  // 404, not 403, even when the board exists but belongs to someone else.
  // A 403 would confirm that the id is real; a 404 reveals nothing.
  if (!board) {
    return jsonError("Board not found", 404);
  }

  return Response.json(board);
}

export async function PATCH(request: Request, { params }: RouteContext) {
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

  const { boardId } = await params;
  const board = await renameBoard(boardId, userId, result.data.title);

  if (!board) {
    return jsonError("Board not found", 404);
  }

  return Response.json(board);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const { boardId } = await params;
  const deleted = await deleteBoard(boardId, userId);

  if (!deleted) {
    return jsonError("Board not found", 404);
  }

  // 204 No Content: it worked and there is nothing to send back.
  // A 204 must not have a body, hence null.
  return new Response(null, { status: 204 });
}

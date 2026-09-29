// PATCH  /api/columns/:columnId - rename a column
// DELETE /api/columns/:columnId - delete it, with its cards
//
// These live at the top level rather than under /api/boards/:boardId/... on
// purpose: a column id already identifies the column, so repeating the board
// in the URL would add nothing. Creating and reordering DO hang off the board,
// because they need to know which board they apply to.

import { getCurrentUserId, jsonError, readJson } from "@/lib/api-helpers";
import { deleteColumn, renameColumn } from "@/lib/columns";
import { columnSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ columnId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const body = await readJson(request);

  if (body === undefined) {
    return jsonError("Invalid JSON body", 400);
  }

  const result = columnSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: "Invalid data", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { columnId } = await params;
  const column = await renameColumn(columnId, userId, result.data.title);

  if (!column) {
    return jsonError("Column not found", 404);
  }

  return Response.json(column);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const { columnId } = await params;
  const deleted = await deleteColumn(columnId, userId);

  if (!deleted) {
    return jsonError("Column not found", 404);
  }

  return new Response(null, { status: 204 });
}

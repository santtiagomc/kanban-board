// POST /api/boards/:boardId/columns - add a column to a board
//
// The route is nested under the board because a column only makes sense
// inside one. The URL says which board, so the body only carries the title.

import { getCurrentUserId, jsonError, readJson } from "@/lib/api-helpers";
import { createColumn } from "@/lib/columns";
import { columnSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ boardId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
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

  const { boardId } = await params;
  const column = await createColumn(boardId, userId, result.data.title);

  if (!column) {
    return jsonError("Board not found", 404);
  }

  return Response.json(column, { status: 201 });
}

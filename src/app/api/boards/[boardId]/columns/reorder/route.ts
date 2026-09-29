// PATCH /api/boards/:boardId/columns/reorder - set the order of every column
//
// The body sends the full list of ids in their new order:
//   { "orderedIds": ["col-c", "col-a", "col-b"] }
//
// Sending the whole list rather than "move column X to position 1" keeps the
// server from having to work out what happens to the other columns, and makes
// the request idempotent: sending it twice leaves the same result.

import { getCurrentUserId, jsonError, readJson } from "@/lib/api-helpers";
import { reorderColumns } from "@/lib/columns";
import { reorderColumnsSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ boardId: string }>;
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

  const result = reorderColumnsSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: "Invalid data", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { boardId } = await params;
  const outcome = await reorderColumns(
    boardId,
    userId,
    result.data.orderedIds,
  );

  if (outcome === "not-found") {
    return jsonError("Board not found", 404);
  }

  if (outcome === "mismatch") {
    return jsonError(
      "orderedIds must contain exactly the columns of this board",
      400,
    );
  }

  return new Response(null, { status: 204 });
}

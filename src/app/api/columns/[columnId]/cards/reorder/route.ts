// PATCH /api/columns/:columnId/cards/reorder
//
// Sets which cards this column holds and in what order:
//   { "orderedIds": ["card-b", "card-a"] }
//
// An id that currently lives in another column of the same board is MOVED
// here, so this one endpoint handles both reordering and dragging between
// columns. The source column needs no separate request.

import { getCurrentUserId, jsonError, readJson } from "@/lib/api-helpers";
import { setColumnCards } from "@/lib/cards";
import { reorderCardsSchema } from "@/lib/validations";

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

  const result = reorderCardsSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: "Invalid data", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { columnId } = await params;
  const outcome = await setColumnCards(columnId, userId, result.data.orderedIds);

  if (outcome === "not-found") {
    return jsonError("Column not found", 404);
  }

  if (outcome === "mismatch") {
    return jsonError(
      "orderedIds must contain unique cards from this board",
      400,
    );
  }

  return new Response(null, { status: 204 });
}

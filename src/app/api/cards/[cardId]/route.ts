// PATCH  /api/cards/:cardId - edit title, description and due date
// DELETE /api/cards/:cardId - delete the card and its subtasks

import { getCurrentUserId, jsonError, readJson } from "@/lib/api-helpers";
import { deleteCard, updateCard } from "@/lib/cards";
import { cardSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ cardId: string }>;
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

  const result = cardSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: "Invalid data", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { cardId } = await params;
  const card = await updateCard(cardId, userId, result.data);

  if (!card) {
    return jsonError("Card not found", 404);
  }

  return Response.json(card);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const { cardId } = await params;
  const deleted = await deleteCard(cardId, userId);

  if (!deleted) {
    return jsonError("Card not found", 404);
  }

  return new Response(null, { status: 204 });
}

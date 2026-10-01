// POST /api/columns/:columnId/cards - add a card to the bottom of a column

import { getCurrentUserId, jsonError, readJson } from "@/lib/api-helpers";
import { createCard } from "@/lib/cards";
import { cardSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ columnId: string }>;
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

  const result = cardSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: "Invalid data", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { columnId } = await params;
  const card = await createCard(columnId, userId, result.data);

  if (!card) {
    return jsonError("Column not found", 404);
  }

  return Response.json(card, { status: 201 });
}

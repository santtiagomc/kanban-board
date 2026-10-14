// POST /api/cards/:cardId/subtasks - add one or more subtasks to a card
//
// The body always carries a list:
//   { "titles": ["Design the schema", "Write the migration"] }
//
// One title or ten, it is the same request. The manual form sends a list of
// one; accepting AI suggestions sends several.

import { getCurrentUserId, jsonError, readJson } from "@/lib/api-helpers";
import { createSubtasks } from "@/lib/subtasks";
import { createSubtasksSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ cardId: string }>;
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

  const result = createSubtasksSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: "Invalid data", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { cardId } = await params;
  const subtasks = await createSubtasks(cardId, userId, result.data.titles);

  if (!subtasks) {
    return jsonError("Card not found", 404);
  }

  // The whole updated list comes back, so the UI can render it without
  // asking again.
  return Response.json(subtasks, { status: 201 });
}

// POST /api/cards/:cardId/suggest-subtasks - propose subtasks for a card
//
// Nothing is saved here. The endpoint only returns suggestions; the user picks
// which ones to keep and those go through POST /api/cards/:cardId/subtasks
// like any other subtask.
//
// Keeping "suggest" and "save" apart is what makes accepting or discarding
// possible, and it means the AI never writes to the database on its own.

import { suggestSubtasks } from "@/lib/ai";
import { getCurrentUserId, jsonError } from "@/lib/api-helpers";
import { getCardForUser } from "@/lib/cards";

type RouteContext = {
  params: Promise<{ cardId: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const { cardId } = await params;

  // The title and description come from the DATABASE, not from the request
  // body. The caller only says which card; it cannot smuggle in text of its
  // own, and it cannot ask for suggestions about a card that isn't theirs.
  const card = await getCardForUser(cardId, userId);

  if (!card) {
    return jsonError("Card not found", 404);
  }

  try {
    const suggestions = await suggestSubtasks({
      title: card.title,
      description: card.description,
    });

    return Response.json({ suggestions });
  } catch (error) {
    // Today this cannot fail - it is a mock. It is wrapped anyway because the
    // whole point of this file is to be swapped for a network call to an AI
    // service, and those fail: timeouts, rate limits, outages.
    console.error("POST /api/cards/[cardId]/suggest-subtasks failed:", error);

    return jsonError("Could not generate suggestions. Please try again.", 503);
  }
}

// PATCH  /api/subtasks/:subtaskId - tick it off, or rename it
// DELETE /api/subtasks/:subtaskId - remove it

import { getCurrentUserId, jsonError, readJson } from "@/lib/api-helpers";
import { deleteSubtask, updateSubtask } from "@/lib/subtasks";
import { updateSubtaskSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ subtaskId: string }>;
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

  const result = updateSubtaskSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: "Invalid data", issues: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { subtaskId } = await params;
  const subtask = await updateSubtask(subtaskId, userId, result.data);

  if (!subtask) {
    return jsonError("Subtask not found", 404);
  }

  return Response.json(subtask);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const { subtaskId } = await params;
  const deleted = await deleteSubtask(subtaskId, userId);

  if (!deleted) {
    return jsonError("Subtask not found", 404);
  }

  return new Response(null, { status: 204 });
}

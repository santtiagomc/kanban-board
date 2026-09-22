// Small helpers shared by every API route, so each handler reads as a list of
// steps instead of repeating the same boilerplate.

import { auth } from "@/auth";

// Consistent error shape across the whole API: { error: "..." }.
// The frontend can always look in the same place for the message.
export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

// Returns the signed-in user's id, or null when there is no valid session.
// auth() verifies the cookie signature, so this is the real check, not the
// optimistic one from proxy.ts.
export async function getCurrentUserId() {
  const session = await auth();

  return session?.user?.id ?? null;
}

// Parses the request body as JSON, returning undefined when it is malformed.
//
// undefined works as a "failed" marker because JSON has no way to express it:
// a valid body can be null, a string, a number, an object... but never
// undefined. So there's no risk of mixing up "failed" with a real value.
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

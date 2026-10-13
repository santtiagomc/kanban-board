// A thin wrapper around fetch for the browser side of the app.
//
// Why it exists: fetch fails in two different ways and it is easy to handle
// only one of them.
//
//   - The server answers 404 / 409 / 500  -> fetch RESOLVES, response.ok false
//   - The server can't be reached at all  -> fetch THROWS
//
// Checking response.ok covers the first case only. An unreachable server would
// throw past the error handling and leave the button stuck on "Saving...".
//
// These functions never throw. They always return the same shape, so every
// caller asks one question: if (!result.ok).

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const NETWORK_ERROR =
  "Could not reach the server. Check your connection and try again.";

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Every API route answers errors as { error: "..." } (see lib/api-helpers.ts),
// so the real message can be shown instead of a generic one. This checks the
// shape before trusting it: the body could be anything.
function extractErrorMessage(body: unknown) {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "string"
  ) {
    return (body as { error: string }).error;
  }

  return GENERIC_ERROR;
}

async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch {
    // Server down, no connection, DNS failure... Nothing was sent, so nothing
    // changed on the server side.
    return { ok: false, error: NETWORK_ERROR };
  }

  // 204 No Content has no body on purpose; calling .json() on it would throw.
  if (response.status === 204) {
    return { ok: true, data: undefined as T };
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    // An empty or non-JSON body is not fatal: the status code already says
    // whether it worked.
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: extractErrorMessage(body) };
  }

  return { ok: true, data: body as T };
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export function apiGet<T>(url: string) {
  return request<T>(url);
}

export function apiPost<T>(url: string, body: unknown) {
  return request<T>(url, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function apiPatch<T>(url: string, body: unknown) {
  return request<T>(url, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function apiDelete(url: string) {
  return request<void>(url, { method: "DELETE" });
}

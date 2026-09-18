// Mounts every Auth.js endpoint under /api/auth/*.
//
// The folder name [...nextauth] is a "catch-all" route: it matches any path
// below /api/auth, so a single file serves /api/auth/signin, /api/auth/signout,
// /api/auth/session, /api/auth/csrf and the rest. Auth.js decides what each
// one does; we only hand it the requests.

import { handlers } from "@/auth";

export const { GET, POST } = handlers;

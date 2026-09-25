// The board list. A Server Component: it queries the database directly through
// lib/boards.ts, with no fetch and no loading state.
//
// Notice it does NOT call its own /api/boards endpoint. That would mean the
// server making an HTTP request to itself, which is slower and pointless: both
// end up calling the same function in lib/.

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppHeader } from "@/components/AppHeader";
import { BoardListItem } from "@/components/boards/BoardListItem";
import { CreateBoardForm } from "@/components/boards/CreateBoardForm";
import { getBoardsForUser } from "@/lib/boards";

export const metadata = {
  title: "Boards | Kanban",
};

// Dates are formatted here, on the server, and travel as plain text.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function BoardsPage() {
  const session = await auth();

  // The real authorization check. proxy.ts only looked for a cookie.
  if (!session?.user?.id) {
    redirect("/login");
  }

  const boards = await getBoardsForUser(session.user.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">
          Your boards
        </h1>

        <CreateBoardForm />

        {boards.length === 0 ? (
          // Empty state: an empty screen with no explanation feels broken.
          <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
            <p className="text-slate-600">You don&apos;t have any boards yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first one above to get started.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {boards.map((board) => (
              <BoardListItem
                key={board.id}
                id={board.id}
                title={board.title}
                updatedLabel={dateFormatter.format(board.updatedAt)}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

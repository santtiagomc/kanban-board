// A single board with its columns. The cards inside them arrive in phase 6.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppHeader } from "@/components/AppHeader";
import { BoardColumns } from "@/components/columns/BoardColumns";
import { getBoardForUser } from "@/lib/boards";

// In Next.js 15+ params is a Promise and has to be awaited, the same as in the
// API routes.
type Props = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardPage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { boardId } = await params;
  const board = await getBoardForUser(boardId, session.user.id);

  // getBoardForUser filters by owner, so this covers both "doesn't exist" and
  // "belongs to someone else". notFound() renders the 404 page, which reveals
  // nothing either way.
  if (!board) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="px-6 py-8">
        <Link
          href="/boards"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          &larr; All boards
        </Link>

        <h1 className="mt-2 mb-8 text-2xl font-semibold text-slate-900">
          {board.title}
        </h1>

        {/* Only the id and title are handed to the client component: the
            position is implicit in the array order, and sending fields the
            UI doesn't use would just be extra weight in the page. */}
        <BoardColumns
          boardId={board.id}
          columns={board.columns.map((column) => ({
            id: column.id,
            title: column.title,
          }))}
        />
      </main>
    </div>
  );
}

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

// Due dates are formatted here, on the server, so every visitor sees the same
// text regardless of their time zone.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

export default async function BoardPage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { boardId } = await params;
  const board = await getBoardForUser(boardId, session.user.id);

  // Read the clock once, so every card on the page is compared against the
  // same instant.
  const now = new Date();

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

        {/* The client component gets data that is ready to display: no raw
            dates, no description text it doesn't show. Positions aren't sent
            either - they're implicit in the array order. */}
        <BoardColumns
          boardId={board.id}
          columns={board.columns.map((column) => ({
            id: column.id,
            title: column.title,
            cards: column.cards.map((card) => ({
              id: card.id,
              title: card.title,
              dueLabel: card.dueDate ? dateFormatter.format(card.dueDate) : null,
              // Compared against "now" on the server, at render time.
              isOverdue: card.dueDate ? card.dueDate < now : false,
              // Only whether there IS a description, not its text: the board
              // shows a small marker, and sending 2000 characters per card
              // for an icon would bloat the page.
              hasDescription: Boolean(card.description),
            })),
          }))}
        />
      </main>
    </div>
  );
}

// Shown while the server renders a single board. Same idea as the list's
// skeleton, shaped like columns instead of rows.

function SkeletonColumn() {
  return (
    <div className="w-72 shrink-0 rounded-lg bg-slate-100 p-3">
      <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
      <div className="space-y-2">
        <div className="h-14 rounded-md bg-white" />
        <div className="h-14 rounded-md bg-white" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="h-6 w-24 rounded bg-slate-200" />
      </div>

      <main className="animate-pulse px-6 py-8">
        <div className="mb-2 h-3 w-20 rounded bg-slate-200" />
        <div className="mt-2 mb-8 h-8 w-56 rounded bg-slate-200" />

        <div className="flex gap-4">
          <SkeletonColumn />
          <SkeletonColumn />
          <SkeletonColumn />
        </div>
      </main>
    </div>
  );
}

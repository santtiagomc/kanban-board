// Shown while the server renders /boards.
//
// A file named loading.tsx is a Next convention: it wraps the page in a React
// Suspense boundary automatically, so this appears the moment the user
// navigates, without waiting for the database query.
//
// Why a skeleton and not "Loading...": grey blocks the same shape as the real
// content make the wait feel shorter, because the layout doesn't jump around
// when the data arrives.

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
      <div className="space-y-2">
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="h-3 w-24 rounded bg-slate-100" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-md bg-slate-100" />
        <div className="h-8 w-16 rounded-md bg-slate-100" />
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

      {/* animate-pulse marks this as "still loading" without any text. */}
      <main className="mx-auto max-w-3xl animate-pulse px-6 py-10">
        <div className="mb-6 h-8 w-40 rounded bg-slate-200" />
        <div className="mb-8 h-10 w-full rounded-md bg-slate-100" />

        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </main>
    </div>
  );
}

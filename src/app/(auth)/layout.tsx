// Shared layout for the sign-in and sign-up pages: a centered card.
//
// The folder name "(auth)" is a route group. Parentheses mean the folder
// organizes files WITHOUT adding a segment to the URL: the page at
// (auth)/login/page.tsx is served at /login, not /auth/login. It exists so
// both pages can share this layout without sharing a URL prefix.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        {children}
      </div>
    </main>
  );
}

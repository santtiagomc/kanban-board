// Shared Tailwind class strings for form elements.
//
// Repeating a dozen utility classes on every input gets unreadable fast, and
// changing the look later would mean editing each one. Naming them once keeps
// the forms readable and the styling consistent.

export const labelClass = "block text-sm font-medium text-slate-700";

export const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 " +
  "placeholder:text-slate-400 focus:border-slate-500 focus:outline-none " +
  "focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100";

export const buttonClass =
  "w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white " +
  "hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 " +
  "focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400";

// Quieter button for secondary actions (cancel, rename...).
export const secondaryButtonClass =
  "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm " +
  "font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

// For destructive actions. Red is a warning, so it is reserved for deleting.
export const dangerButtonClass =
  "rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm " +
  "font-medium text-red-700 hover:bg-red-50 disabled:opacity-50";

// Message shown under a single field.
export const fieldErrorClass = "mt-1 text-sm text-red-600";

// Message shown for the whole form (wrong password, server down...).
export const formErrorClass =
  "rounded-md bg-red-50 px-3 py-2 text-sm text-red-700";

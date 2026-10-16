// Subtask suggestions.
//
// THIS IS A MOCK. It produces plausible subtasks from the card's title and
// description using templates, without calling any AI service. It is written
// this way on purpose: the project should run and be demoed with no API key
// and no cost.
//
// The point of this file is the SEAM. Everything else in the app only knows
// about suggestSubtasks(input): the route, the button and the UI never learn
// where the text came from. Swapping the mock for a real model means
// rewriting this one function, with no changes anywhere else:
//
//   1. npm install @anthropic-ai/sdk
//   2. Put ANTHROPIC_API_KEY in .env (and in .env.example, without a value)
//   3. Rewrite suggestSubtasks to call the API and parse the reply into an
//      array of strings, keeping the same signature and the same limits
//      (MIN_SUGGESTIONS..MAX_SUGGESTIONS, MAX_LENGTH per item)
//
// Keep the limits even with a real model: the response comes from outside and
// goes straight into the database, so it has to be validated like any other
// untrusted input.

export type SuggestSubtasksInput = {
  title: string;
  description?: string | null;
};

const MAX_SUGGESTIONS = 5;
const MAX_LENGTH = 200;

// A fake delay. Without it the loading state would never be visible, and the
// UI would not be ready for the 1-3 seconds a real model takes.
const FAKE_DELAY_MS = 900;

// Keyword -> steps that usually go with that kind of task. Matching is done
// on the lowercased title and description.
const TEMPLATES: { keywords: string[]; steps: string[] }[] = [
  {
    keywords: ["design", "ui", "mockup", "layout", "style"],
    steps: [
      "Sketch the layout",
      "Pick colours and typography",
      "Build the responsive version",
      "Review the result on mobile",
    ],
  },
  {
    keywords: ["bug", "fix", "error", "issue", "crash"],
    steps: [
      "Reproduce the problem",
      "Find the root cause",
      "Write a test that fails",
      "Apply the fix and verify it",
    ],
  },
  {
    keywords: ["test", "testing", "qa"],
    steps: [
      "List the cases to cover",
      "Write the happy path test",
      "Add the edge cases",
      "Run the whole suite",
    ],
  },
  {
    keywords: ["deploy", "release", "ship", "production"],
    steps: [
      "Review the environment variables",
      "Run the production build locally",
      "Deploy to staging",
      "Check logs after going live",
    ],
  },
  {
    keywords: ["write", "document", "readme", "docs", "article"],
    steps: [
      "Outline the sections",
      "Write the first draft",
      "Add examples",
      "Proofread and publish",
    ],
  },
  {
    keywords: ["database", "schema", "migration", "model", "sql"],
    steps: [
      "Define the entities and their relations",
      "Write the migration",
      "Apply it to the local database",
      "Check the queries it enables",
    ],
  },
  {
    keywords: ["meet", "meeting", "call", "interview"],
    steps: [
      "Prepare the agenda",
      "Send the invitation",
      "Take notes during the call",
      "Share the follow-up actions",
    ],
  },
];

// Used when nothing matches: a generic breakdown that still beats a blank
// page, which is what these suggestions are really for.
const GENERIC_STEPS = [
  "Clarify what done looks like",
  "Gather what is needed to start",
  "Do the main work",
  "Review the result",
];

export async function suggestSubtasks(
  input: SuggestSubtasksInput,
): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS));

  const haystack = `${input.title} ${input.description ?? ""}`.toLowerCase();

  const matched = TEMPLATES.find((template) =>
    template.keywords.some((keyword) => haystack.includes(keyword)),
  );

  const steps = matched ? matched.steps : GENERIC_STEPS;

  // The card's own title leads the list, so the suggestions clearly belong to
  // this card and not to a generic checklist.
  const shortTitle =
    input.title.length > 40 ? `${input.title.slice(0, 40)}...` : input.title;

  const suggestions = [`Plan "${shortTitle}"`, ...steps];

  return suggestions
    .slice(0, MAX_SUGGESTIONS)
    .map((suggestion) => suggestion.slice(0, MAX_LENGTH));
}

// Subtask suggestions.
//
// Two implementations behind one function:
//
//   GEMINI_API_KEY set     -> ask Google Gemini
//   GEMINI_API_KEY missing -> use the local mock
//
// That fallback is deliberate. Anyone who clones this repository can run it
// and press "Suggest subtasks" without signing up for anything, and the
// feature still works. A portfolio project that crashes on a missing API key
// makes a poor first impression.
//
// The mock is also the safety net at runtime: if the model is unreachable,
// rate limited or answers something unusable, the suggestions still appear.
//
// This file is the SEAM. The route, the button and the UI only know
// suggestSubtasks(input) and never learn where the text came from, so
// changing or adding a provider is a change to this file alone.

export type SuggestSubtasksInput = {
  title: string;
  description?: string | null;
};

const MAX_SUGGESTIONS = 5;
const MAX_LENGTH = 200;

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Model names on hosted providers come and go. Keeping it in an environment
// variable means a model being retired is a config change, not a code change.
//
// Careful with the /models listing endpoint: it reports models that are no
// longer open to new API keys, and asking for one returns 404 with a message
// naming the replacement. The error body is the reliable source, not the
// listing - which is why the error below includes it.
const DEFAULT_MODEL = "gemini-3.8-flash";

// How long to wait before giving up and using the mock.
//
// 15 seconds was not enough: these models reason before answering, and the
// first call of a session is slower still. The number is a trade-off, not a
// detail - too low and working requests get killed, too high and a stuck
// provider leaves the user staring at "Thinking..." for half a minute.
const TIMEOUT_MS = 30_000;

// Fake delay for the mock. Without it the loading state would never be
// visible, and the UI would not be ready for the seconds a real model takes.
const FAKE_DELAY_MS = 900;

// ---------------------------------------------------------------------------
// Shared validation
// ---------------------------------------------------------------------------

// Everything that leaves this file goes through here, mock or model alike.
// A model's answer is untrusted input heading for the database: it can be
// enormous, empty, repeated, or not even a list of strings.
function normalizeSuggestions(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const cleaned = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => value.slice(0, MAX_LENGTH));

  // Drop duplicates: models sometimes repeat themselves.
  return [...new Set(cleaned)].slice(0, MAX_SUGGESTIONS);
}

// ---------------------------------------------------------------------------
// The mock
// ---------------------------------------------------------------------------

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

const GENERIC_STEPS = [
  "Clarify what done looks like",
  "Gather what is needed to start",
  "Do the main work",
  "Review the result",
];

async function mockSuggestions(
  input: SuggestSubtasksInput,
): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS));

  const haystack = `${input.title} ${input.description ?? ""}`.toLowerCase();

  const matched = TEMPLATES.find((template) =>
    template.keywords.some((keyword) => haystack.includes(keyword)),
  );

  const steps = matched ? matched.steps : GENERIC_STEPS;

  const shortTitle =
    input.title.length > 40 ? `${input.title.slice(0, 40)}...` : input.title;

  return normalizeSuggestions([`Plan "${shortTitle}"`, ...steps]);
}

// ---------------------------------------------------------------------------
// The real model (Google Gemini)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = [
  "You break tasks down into concrete subtasks.",
  `Reply with JSON only: {"subtasks": ["...", "..."]}.`,
  `Give between 3 and ${MAX_SUGGESTIONS} subtasks.`,
  "Each one must be a short actionable step, under 100 characters,",
  "starting with a verb. No numbering, no extra commentary.",
  "Answer in the same language as the task.",
].join(" ");

// Errors worth trying again. They say "something went wrong on our side right
// now", not "your request is wrong":
//   500, 502, 504 - the provider broke
//   503           - the model is overloaded ("high demand")
//
// 4xx is deliberately absent: a wrong key or a missing model will be just as
// wrong the second time, and retrying only makes the user wait longer.
// 429 is left out too - retrying a rate limit makes it worse.
const RETRYABLE_STATUS = [500, 502, 503, 504];

const RETRY_DELAY_MS = 1500;

async function geminiSuggestions(
  input: SuggestSubtasksInput,
  apiKey: string,
  attempt = 1,
): Promise<string[]> {
  // `||` and not `??`: an empty GEMINI_MODEL="" in .env is neither null nor
  // undefined, so `??` would keep the empty string and build a broken URL.
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const userPrompt = [
    `Task: ${input.title}`,
    input.description ? `Details: ${input.description}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: {
      // The key goes in a header, not in the URL as ?key=... Query strings
      // end up in server logs and browser history; headers don't.
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Gemini keeps the instructions separate from the user's message.
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        // Low temperature: this is a practical checklist, not creative
        // writing.
        temperature: 0.4,
        // Generous for five short lines, and deliberately so: the 2.5 models
        // "think" before answering, and that reasoning spends output tokens
        // too. Too low a limit and the budget runs out mid-thought, leaving
        // an empty reply - which looks like a bug rather than a quota.
        maxOutputTokens: 2048,
        // These models reason internally before answering, and that reasoning
        // is most of the wait. Breaking a task into five short steps does not
        // need it, so the budget is set to zero: the answer comes back in a
        // couple of seconds instead of fifteen.
        //
        // If a model does not support this field the API replies 400, and the
        // error now carries the body that says so.
        thinkingConfig: { thinkingBudget: 0 },
        // Asks for JSON instead of prose, so the reply can be parsed.
        responseMimeType: "application/json",
      },
    }),
    // Without a timeout a slow provider would hold the request open for as
    // long as it likes, and the user would sit watching "Thinking...".
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    // One retry for transient failures, then give up. Waiting a moment first
    // matters: hammering an overloaded server immediately tends to get the
    // same answer.
    if (RETRYABLE_STATUS.includes(response.status) && attempt === 1) {
      console.warn(
        `Gemini replied ${response.status}, retrying once in ${RETRY_DELAY_MS}ms...`,
      );

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

      return geminiSuggestions(input, apiKey, 2);
    }

    // The status code alone ("404") rarely says enough. Gemini explains the
    // reason in the body - which model it could not find, which API version
    // it looked in - so it is read and included in the error. Throwing away
    // that text turns a two-minute fix into guesswork.
    const detail = await response.text().catch(() => "");

    // 429 on a free tier means the rate limit was reached.
    // 404 usually means the model name is wrong for this key.
    throw new Error(
      `Gemini replied ${response.status} for model "${model}": ${detail.slice(0, 500)}`,
    );
  }

  const payload = await response.json();

  // The answer is buried a few levels down, and any of them can be missing
  // if the model refused to answer or ran out of tokens.
  const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof content !== "string") {
    throw new Error("Gemini returned no content");
  }

  // Even with responseMimeType the content is a STRING holding JSON, so it
  // still has to be parsed - and parsing can still fail.
  const parsed = JSON.parse(content);

  // The model was asked for { subtasks: [...] }, but a bare array is a
  // plausible mistake, so both shapes are accepted.
  const suggestions = normalizeSuggestions(
    Array.isArray(parsed) ? parsed : parsed?.subtasks,
  );

  if (suggestions.length === 0) {
    throw new Error("Gemini returned no usable suggestions");
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// What the rest of the app sees
// ---------------------------------------------------------------------------

export async function suggestSubtasks(
  input: SuggestSubtasksInput,
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  // No key configured: straight to the mock, no error, nothing logged. This
  // is the normal case for anyone who just cloned the repository.
  if (!apiKey) {
    return mockSuggestions(input);
  }

  try {
    return await geminiSuggestions(input, apiKey);
  } catch (error) {
    // Falling back beats failing: the user still gets usable suggestions.
    // The error is logged so the cause is visible in the server output
    // instead of disappearing silently.
    console.error("Gemini suggestions failed, using the mock instead:", error);

    return mockSuggestions(input);
  }
}

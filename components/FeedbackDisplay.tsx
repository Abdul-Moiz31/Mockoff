import { motion } from "framer-motion";

/**
 * Parses the model's feedback into structured sections and renders them with
 * visual hierarchy (score badge + labelled sections + bullet lists).
 *
 * The model is prompted (see pages/demo.tsx) to emit sections with headers:
 *   SCORE: <0-100>
 *   SUMMARY: ...
 *   STRENGTHS: - ...
 *   IMPROVEMENTS: - ...
 * but parsing is forgiving: anything unrecognised falls back to plain text so a
 * mid-stream or off-format response still renders something useful.
 */

interface ParsedFeedback {
  score: number | null;
  summary: string;
  strengths: string[];
  improvements: string[];
  fallback: string;
}

function parseFeedback(raw: string): ParsedFeedback {
  const result: ParsedFeedback = {
    score: null,
    summary: "",
    strengths: [],
    improvements: [],
    fallback: "",
  };

  if (!raw || !raw.trim()) return result;

  // Detect the structured format by looking for our section labels.
  const hasStructure = /SCORE:|SUMMARY:|STRENGTHS:|IMPROVEMENTS:/i.test(raw);
  if (!hasStructure) {
    result.fallback = raw;
    return result;
  }

  const scoreMatch = raw.match(/SCORE:\s*(\d{1,3})/i);
  if (scoreMatch) {
    result.score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)));
  }

  const section = (label: string): string => {
    const re = new RegExp(
      `${label}:\\s*([\\s\\S]*?)(?=\\n\\s*(?:SCORE|SUMMARY|STRENGTHS|IMPROVEMENTS):|$)`,
      "i"
    );
    const m = raw.match(re);
    return m ? m[1].trim() : "";
  };

  result.summary = section("SUMMARY");

  const toBullets = (text: string): string[] =>
    text
      .split(/\n/)
      .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
      .filter((l) => l.length > 0);

  result.strengths = toBullets(section("STRENGTHS"));
  result.improvements = toBullets(section("IMPROVEMENTS"));

  return result;
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-800 ring-emerald-600/20";
  if (score >= 60) return "bg-amber-100 text-amber-800 ring-amber-600/20";
  return "bg-red-100 text-red-800 ring-red-600/20";
}

export default function FeedbackDisplay({ feedback }: { feedback: string }) {
  const parsed = parseFeedback(feedback);

  if (parsed.fallback) {
    return (
      <div className="rounded-lg border border-[#EEEEEE] bg-[#FAFAFA] p-4 text-sm leading-6 text-gray-900">
        <p className="prose prose-sm max-w-none whitespace-pre-wrap">
          {parsed.fallback}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {parsed.score !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-3"
        >
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-lg font-bold ring-1 ring-inset ${scoreColor(
              parsed.score
            )}`}
          >
            {parsed.score}/100
          </span>
          <span className="text-sm text-gray-500">Overall response score</span>
        </motion.div>
      )}

      {parsed.summary && (
        <div className="rounded-lg border border-[#EEEEEE] bg-[#FAFAFA] p-4">
          <h3 className="mb-1 text-sm font-semibold text-[#1D2B3A]">Summary</h3>
          <p className="text-sm leading-6 text-gray-700">{parsed.summary}</p>
        </div>
      )}

      {parsed.strengths.length > 0 && (
        <div className="rounded-lg border border-[#D0E7DC] bg-[#F3FAF1] p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            What went well
          </h3>
          <ul className="space-y-1.5">
            {parsed.strengths.map((item, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-6 text-gray-700"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {parsed.improvements.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            How to improve
          </h3>
          <ul className="space-y-1.5">
            {parsed.improvements.map((item, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-6 text-gray-700"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nothing parsed yet (stream just started) — show a gentle placeholder. */}
      {parsed.score === null &&
        !parsed.summary &&
        parsed.strengths.length === 0 &&
        parsed.improvements.length === 0 && (
          <div className="rounded-lg border border-[#EEEEEE] bg-[#FAFAFA] p-4 text-sm text-gray-500">
            Analyzing your response…
          </div>
        )}
    </div>
  );
}

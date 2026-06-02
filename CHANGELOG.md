# Changelog

All notable changes to Mockoff are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Phase 4 — Frontend UX
- **Landing CTA:** "Start a mock interview" is now the primary above-the-fold action (prominent
  dark button with arrow); "Star on GitHub" is demoted to a secondary button. Visitors now know
  what to do first.
- **Structured feedback:** the AI now returns a score (0–100), a summary, strengths, and
  improvement suggestions. A new `FeedbackDisplay` component renders these with a colored score
  badge, labelled sections, and bullet lists instead of one plain-text blob. Parsing is forgiving
  and falls back to plain text for off-format responses.
- **Results UX:** clear "Generating feedback…" loading state, empty-response guidance, and the
  Phase 2 error/retry state are now distinct.
- **Mobile/Safari:** iOS Safari users see a non-blocking warning before recording (ffmpeg.wasm
  memory limits), recommending desktop Chrome/Edge/Firefox.
- **Cleanup:** removed 577 lines of dead commented-out landing-page code from `app/page.tsx`.

### Phase 3 — Backend Reliability
- **Render compatibility:** converted `/api/generate` from the Vercel Edge runtime to a Node
  streaming handler so it deploys cleanly on Render. Feedback still streams token-by-token; the
  stream is cancelled if the client disconnects.
- **Hardened `/api/generate`:** rejects non-POST (405) and empty prompts (400); returns a JSON
  error (502) when OpenAI is unavailable instead of streaming an empty body; raised `max_tokens`
  to allow fuller feedback.
- **Hardened `/api/transcribe`:** normalizes single/array uploads, validates file size (≤25 MB)
  and mime type, returns distinct status codes (400/413/415/422/500), uses the OS temp dir
  (Render-safe), and always deletes the temp file afterwards.
- **`OpenAIStream`:** now throws on upstream failure (so callers see a real error) and is
  runtime-agnostic.
- **Rate limiting:** clarified that Upstash middleware is fully optional (auto-disabled without
  env vars).

### Phase 2 — Critical Fixes
- **Reliability:** wrapped the transcription + feedback-stream flow in error handling. A failed
  transcription, moderation flag, or GPT stream error now shows a clear message and a "Try again"
  button instead of hanging silently on "Processing".
- **Reliability:** the client no longer reads `transcript.length` on the error path (previously
  crashed when the server returned `{error}`), and empty transcripts show a helpful prompt.
- **Config:** added `utils/env.ts` for centralized environment access/validation; `/api/transcribe`
  now fails fast with a clear message when `OPENAI_API_KEY` is missing.
- **Branding:** removed leftover "liftoff"/"Precedent" references — fixed `sitemap.ts`,
  `opengraph-image` alt text, root metadata, and `package.json` name. Site URL is now driven by
  `NEXT_PUBLIC_SITE_URL`.
- **Docs:** expanded `.env.example` with descriptions and `NEXT_PUBLIC_SITE_URL`.

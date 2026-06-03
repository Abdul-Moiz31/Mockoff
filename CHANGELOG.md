# Changelog

All notable changes to Mockoff are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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

/**
 * Centralized environment-variable access and validation.
 *
 * Importing this module never throws — it only reads values. Call `assertServerEnv()`
 * at the start of an API handler when a variable is genuinely required, so a
 * misconfigured deploy fails loudly with a clear message instead of a generic 500.
 */

type EnvKey =
  | "OPENAI_API_KEY"
  | "UPSTASH_REDIS_REST_URL"
  | "UPSTASH_REDIS_REST_TOKEN"
  | "DATABASE_URL"
  | "NEXTAUTH_SECRET"
  | "NEXTAUTH_URL";

export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
};

/** True only when both Upstash variables are present, so rate-limiting stays optional. */
export const isRateLimitConfigured = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
);

/**
 * Throws a descriptive error if any of the given required variables are missing.
 * Use inside server handlers, e.g. `assertServerEnv("OPENAI_API_KEY")`.
 */
export function assertServerEnv(...keys: EnvKey[]): void {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Set them in your environment (see .env.example).`
    );
  }
}

/**
 * Logs a one-line startup warning for any recommended-but-missing variable.
 * Safe to call from module scope; never throws.
 */
export function warnMissingEnv(): void {
  if (!env.OPENAI_API_KEY) {
    // eslint-disable-next-line no-console
    console.warn(
      "[env] OPENAI_API_KEY is not set — transcription and feedback will fail until it is configured."
    );
  }
}

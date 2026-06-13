/**
 * API client for communicating with the nwod-angel REST API.
 *
 * Commands that would otherwise do work locally can delegate to the API,
 * with a fallback to the direct import path if the API is unavailable.
 *
 * Controlled by the USE_API_ROLL environment variable:
 *   "true"  — try the API first, fall back to direct path on failure
 *   (unset or any other value) — use the direct path only
 */

import { logger } from "./logger.js";

const API_BASE_URL = process.env["API_BASE_URL"] || "http://localhost:3001";
const USE_API_ROLL = process.env["USE_API_ROLL"] === "true";

// ── Types ──────────────────────────────────────────────────────

export interface RollApiParams {
  dicePool: number;
  userId: string;
  characterName?: string;
  description?: string;
  successThreshold?: number;
  rerollThreshold?: number;
  rote?: boolean;
  extendedRolls?: number;
  target?: number;
  interactionId?: string;
  channelId?: string;
  guildId?: string;
}

export interface RollApiDie {
  value: number;
  isSuccess: boolean;
  isReroll: boolean;
}

export interface RollApiResponse {
  id: number | null;
  timestamp: string;
  dicePool: number;
  characterName?: string;
  characterPortrait?: string;
  description?: string;
  successThreshold: number;
  rerollThreshold: number;
  exceptionSuccessThreshold: number;
  rote: boolean;
  result: string; // "critical_failure" | "failure" | "success" | "exceptional_success"
  resultCode: number; // 1–4
  successes: number;
  rollDescription: string;
  postedToDiscord: boolean;
  diceRolled?: RollApiDie[];
  rolledDice?: RollApiDie[][];
  extendedRolls?: number;
  target?: number;
  persistError?: string;
  discordError?: string;
}

// ── API call helpers ───────────────────────────────────────────

/**
 * Roll dice via the REST API.
 * Throws on network error or non-2xx response.
 */
export async function rollViaApi(
  params: RollApiParams,
): Promise<RollApiResponse> {
  const url = `${API_BASE_URL}/roll`.replace(/\/+$/, "");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let detail = `API roll failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.message) detail = body.message;
    } catch {
      // ignore parse failure, use default detail
    }
    throw new Error(detail);
  }

  return (await res.json()) as RollApiResponse;
}

// ── Character names (for autocomplete) ─────────────────────────

export interface CharacterNamesResponse {
  data: string[];
}

/**
 * Fetch a user's character names for autocomplete.
 * Returns an empty array on any error (fail gracefully for autocomplete).
 */
export async function fetchCharacterNames(userId: string): Promise<string[]> {
  const url = `${API_BASE_URL}/users/${encodeURIComponent(userId)}/character-names`.replace(/\/+$/, "");
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const body = await res.json() as CharacterNamesResponse;
    return body.data;
  } catch {
    return []; // Fail gracefully — return empty on error
  }
}

// ── Character portraits (for embed thumbnails) ─────────────────

export interface CharacterPortraitEntry {
  name: string;
  portrait: string | null;
}

export interface CharacterPortraitsResponse {
  data: CharacterPortraitEntry[];
}

/**
 * Fetch a user's character portraits for embed thumbnails.
 * Returns an empty array on any error (fail gracefully).
 */
export async function fetchCharacterPortraits(userId: string): Promise<CharacterPortraitEntry[]> {
  const url = `${API_BASE_URL}/users/${encodeURIComponent(userId)}/character-portraits`.replace(/\/+$/, "");
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const body = await res.json() as CharacterPortraitsResponse;
    return body.data;
  } catch {
    return []; // Fail gracefully — return empty on error
  }
}

// ── Character autocomplete (for /post) ──────────────────────────

export interface CharacterAutocompleteEntry {
  id: number;
  name: string;
  concept: string | null;
}

export interface CharacterAutocompleteResponse {
  data: CharacterAutocompleteEntry[];
}

/**
 * Fetch a user's character autocomplete data (id, name, concept).
 * Returns an empty array on any error (fail gracefully for autocomplete).
 */
export async function fetchCharacterAutocomplete(userId: string): Promise<CharacterAutocompleteEntry[]> {
  const url = `${API_BASE_URL}/users/${encodeURIComponent(userId)}/character-autocomplete`.replace(/\/+$/, "");
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const body = await res.json() as CharacterAutocompleteResponse;
    return body.data;
  } catch {
    return []; // Fail gracefully — return empty on error
  }
}

// ── Post as character (via /post) ──────────────────────────────

export interface PostAsCharacterParams {
  userId: string;
  characterId?: number;
  characterName?: string;
  content: string;
  imageUrl?: string;
  channelId: string;
  threadId?: string;
}

export interface PostAsCharacterResponse {
  posted: boolean;
  characterName?: string;
  error?: string;
}

/**
 * Discriminated error from `postAsCharacterViaApi`.
 *
 * - `network` — connection failed (DNS, TLS, timeout, fetch abort)
 * - `auth` — bot token rejected (401/403 from requireBotAuth)
 * - `api` — API returned an error response (4xx/5xx)
 */
export class PostError extends Error {
  readonly kind: "network" | "auth" | "api";
  /** HTTP status code, only present when kind is "auth" or "api". */
  readonly status?: number;
  /** Original error, if any (e.g. the native fetch TypeError). */
  readonly cause?: unknown;

  constructor(opts: { kind: PostError["kind"]; message: string; status?: number; cause?: unknown }) {
    super(opts.message);
    this.name = "PostError";
    this.kind = opts.kind;
    this.status = opts.status;
    this.cause = opts.cause;
  }
}

/** Maximum number of attempts for transient network errors. */
const POST_MAX_RETRIES = 2;
/** Base delay (ms) for exponential backoff between retries. */
const POST_RETRY_BASE_MS = 1_000;
/** Timeout (ms) for the fetch call. */
const POST_TIMEOUT_MS = 30_000;

/**
 * Classify a thrown error from native fetch into a PostError kind.
 *
 * Native fetch throws TypeError for network failures (DNS, TLS, connection
 * refused, etc.) and AbortError for timeouts. Everything else is treated
 * as an unexpected error.
 */
function classifyNetworkError(err: unknown): PostError {
  if (err instanceof Error) {
    // AbortError from AbortSignal.timeout()
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      logger.error({ err, cause: err.cause }, "[apiClient] Post request timed out");
      return new PostError({ kind: "network", message: "Request timed out", cause: err });
    }
    // TypeError from native fetch — network-level failure
    if (err.name === "TypeError" && err.message === "fetch failed") {
      logger.error({ err, cause: err.cause }, "[apiClient] Post fetch failed — network error");
      return new PostError({ kind: "network", message: "Could not reach the API server", cause: err });
    }
    // Other TypeError variants (e.g. "fetch aborted")
    if (err.name === "TypeError") {
      logger.error({ err, cause: err.cause }, "[apiClient] Post network error");
      return new PostError({ kind: "network", message: `Network error: ${err.message}`, cause: err });
    }
  }
  logger.error({ err }, "[apiClient] Post unexpected network error");
  return new PostError({ kind: "network", message: "Unexpected network error", cause: err });
}

/**
 * Post a message to a Discord channel as a character via the REST API.
 * Uses Authorization: Bot <DISCORD_TOKEN> shared secret.
 *
 * Retries up to `POST_MAX_RETRIES` times on transient network errors
 * (connection failure, timeout). Non-retryable errors (auth, API) are
 * thrown immediately.
 *
 * Throws `PostError` on failure.
 */
export async function postAsCharacterViaApi(
  params: PostAsCharacterParams,
): Promise<PostAsCharacterResponse> {
  const botToken = process.env["DISCORD_TOKEN"];
  const url = `${API_BASE_URL}/discord/post`.replace(/\/+$/, "");

  let lastError: PostError | undefined;

  for (let attempt = 0; attempt <= POST_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${botToken}`,
        },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(POST_TIMEOUT_MS),
      });

      // ── HTTP-level errors ────────────────────────────────────
      if (!res.ok) {
        let detail = `Post failed (${res.status})`;
        try {
          const body = await res.json();
          if (body.message) detail = body.message;
        } catch {
          // ignore parse failure, use default detail
        }

        // 401/403 from requireBotAuth — not retryable
        if (res.status === 401 || res.status === 403) {
          throw new PostError({ kind: "auth", message: detail, status: res.status });
        }

        // Other API errors — not retryable
        throw new PostError({ kind: "api", message: detail, status: res.status });
      }

      return (await res.json()) as PostAsCharacterResponse;
    } catch (err) {
      // Already a PostError — only retry network errors
      if (err instanceof PostError) {
        if (err.kind !== "network" || attempt >= POST_MAX_RETRIES) {
          throw err;
        }
        lastError = err;
      } else {
        // Raw fetch error — classify it
        lastError = classifyNetworkError(err);
        if (lastError.kind !== "network" || attempt >= POST_MAX_RETRIES) {
          throw lastError;
        }
      }

      // Exponential backoff: 1s, 2s, ...
      const delayMs = POST_RETRY_BASE_MS * Math.pow(2, attempt);
      logger.warn({ attempt: attempt + 1, maxRetries: POST_MAX_RETRIES, delayMs }, "[apiClient] Retrying post after network error");
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  // Should never reach here, but satisfy TypeScript
  throw lastError ?? new PostError({ kind: "network", message: "Max retries exceeded" });
}

export { API_BASE_URL, USE_API_ROLL };

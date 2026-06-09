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
 * Post a message to a Discord channel as a character via the REST API.
 * Uses Authorization: Bot <DISCORD_TOKEN> shared secret.
 * Throws on network error or non-2xx response.
 */
export async function postAsCharacterViaApi(
  params: PostAsCharacterParams,
): Promise<PostAsCharacterResponse> {
  const botToken = process.env["DISCORD_TOKEN"];
  const url = `${API_BASE_URL}/discord/post`.replace(/\/+$/, "");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${botToken}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let detail = `Post failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.message) detail = body.message;
    } catch {
      // ignore parse failure, use default detail
    }
    throw new Error(detail);
  }

  return (await res.json()) as PostAsCharacterResponse;
}

export { API_BASE_URL, USE_API_ROLL };

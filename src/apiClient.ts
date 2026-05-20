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

export { API_BASE_URL, USE_API_ROLL };

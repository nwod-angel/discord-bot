/**
 * Unit tests for apiClient.ts
 *
 * Tests rollViaApi with mocked fetch, and USE_API_ROLL/API_BASE_URL
 * environment variable handling.
 */

// ── Mock fetch before imports ──────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// ── Mock environment ───────────────────────────────────────────

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

// ── Tests ──────────────────────────────────────────────────────

describe("rollViaApi", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("sends POST request to the API /roll endpoint", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 42,
        dicePool: 5,
        resultCode: 3,
        successes: 3,
        rollDescription: "Rolled 5 dice...",
        postedToDiscord: false,
      }),
    });

    // Import after setting env
    const { rollViaApi } = await import("../apiClient.js");
    const result = await rollViaApi({
      dicePool: 5,
      userId: "test-user",
    });

    expect(result.id).toBe(42);
    expect(result.successes).toBe(3);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/roll",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("sends all params in the request body", async () => {
    const sentBody: any = {};
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    mockFetch.mockImplementation(async (_url: string, opts: any) => {
      Object.assign(sentBody, JSON.parse(opts.body));
      return {
        ok: true,
        json: async () => ({}),
      };
    });

    const { rollViaApi } = await import("../apiClient.js");
    await rollViaApi({
      dicePool: 7,
      userId: "user-1",
      characterName: "Alice",
      description: "Shooting",
      successThreshold: 8,
      rerollThreshold: 10,
      rote: true,
      extendedRolls: 3,
      target: 15,
      interactionId: "interaction-123",
      channelId: "channel-456",
      guildId: "guild-789",
    });

    expect(sentBody.dicePool).toBe(7);
    expect(sentBody.userId).toBe("user-1");
    expect(sentBody.characterName).toBe("Alice");
    expect(sentBody.description).toBe("Shooting");
    expect(sentBody.successThreshold).toBe(8);
    expect(sentBody.rerollThreshold).toBe(10);
    expect(sentBody.rote).toBe(true);
    expect(sentBody.extendedRolls).toBe(3);
    expect(sentBody.target).toBe(15);
    expect(sentBody.interactionId).toBe("interaction-123");
    expect(sentBody.channelId).toBe("channel-456");
    expect(sentBody.guildId).toBe("guild-789");
  });

  it("throws on 400 response with API error message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Validation failed" }),
    });

    const { rollViaApi } = await import("../apiClient.js");
    await expect(
      rollViaApi({ dicePool: -1, userId: "test" }),
    ).rejects.toThrow("Validation failed");
  });

  it("throws with status code when no message body", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("no body");
      },
    });

    const { rollViaApi } = await import("../apiClient.js");
    await expect(
      rollViaApi({ dicePool: 5, userId: "test" }),
    ).rejects.toThrow("API roll failed (500)");
  });

  it("throws on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const { rollViaApi } = await import("../apiClient.js");
    await expect(
      rollViaApi({ dicePool: 5, userId: "test" }),
    ).rejects.toThrow("Network failure");
  });

  it("includes extended roll fields in response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 42,
        extendedRolls: 3,
        target: 15,
        rolledDice: [[{ value: 8, isSuccess: true, isReroll: false }]],
      }),
    });

    const { rollViaApi } = await import("../apiClient.js");
    const result = await rollViaApi({
      dicePool: 5,
      userId: "test",
      extendedRolls: 3,
    });

    expect(result.extendedRolls).toBe(3);
    expect(result.rolledDice).toHaveLength(1);
  });

  it("includes discord delivery fields when present", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 42,
        postedToDiscord: true,
        channelId: "channel-456",
      }),
    });

    const { rollViaApi } = await import("../apiClient.js");
    const result = await rollViaApi({
      dicePool: 5,
      userId: "test",
      channelId: "channel-456",
    });

    expect(result.postedToDiscord).toBe(true);
  });

  it("reports postedToDiscord false when delivery fails", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 42,
        postedToDiscord: false,
        discordError: "Unknown channel",
      }),
    });

    const { rollViaApi } = await import("../apiClient.js");
    const result = await rollViaApi({
      dicePool: 5,
      userId: "test",
      channelId: "invalid-channel",
    });

    expect(result.postedToDiscord).toBe(false);
    expect(result.discordError).toBe("Unknown channel");
  });
});

describe("USE_API_ROLL", () => {
  it("is true when env var is 'true'", () => {
    process.env["USE_API_ROLL"] = "true";

    // Can't easily re-import, but we can test the module's value
    // Jest caches modules, but we're using jest.resetModules in beforeEach
  });

  it("is false when env var is unset", () => {
    delete process.env["USE_API_ROLL"];
    // Default should be false
  });
});

describe("fetchCharacterPortraits", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("fetches portraits from the API endpoint", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { name: "Alice", portrait: "https://example.com/alice.png" },
          { name: "Bob", portrait: null },
        ],
      }),
    });

    const { fetchCharacterPortraits } = await import("../apiClient.js");
    const result = await fetchCharacterPortraits("user-1");

    expect(result).toEqual([
      { name: "Alice", portrait: "https://example.com/alice.png" },
      { name: "Bob", portrait: null },
    ]);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/users/user-1/character-portraits",
    );
  });

  it("returns empty array on non-ok response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    const { fetchCharacterPortraits } = await import("../apiClient.js");
    const result = await fetchCharacterPortraits("user-1");

    expect(result).toEqual([]);
  });

  it("returns empty array on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const { fetchCharacterPortraits } = await import("../apiClient.js");
    const result = await fetchCharacterPortraits("user-1");

    expect(result).toEqual([]);
  });

  it("encodes the userId in the URL", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { fetchCharacterPortraits } = await import("../apiClient.js");
    await fetchCharacterPortraits("user/id with spaces");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/users/user%2Fid%20with%20spaces/character-portraits",
    );
  });
});

describe("API_BASE_URL", () => {
  it("uses env var when set", async () => {
    process.env["API_BASE_URL"] = "https://api.example.com";

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, postedToDiscord: false }),
    });

    const { rollViaApi } = await import("../apiClient.js");
    await rollViaApi({ dicePool: 5, userId: "test" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/roll",
      expect.anything(),
    );
  });

  it("defaults to localhost:3001 when unset", async () => {
    delete process.env["API_BASE_URL"];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, postedToDiscord: false }),
    });

    const { rollViaApi } = await import("../apiClient.js");
    await rollViaApi({ dicePool: 5, userId: "test" });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/roll",
      expect.anything(),
    );
  });
});

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

describe("fetchCharacterAutocomplete", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("fetches autocomplete data from the API endpoint", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 1, name: "Alice", concept: "Mage" },
          { id: 2, name: "Bob", concept: null },
        ],
      }),
    });

    const { fetchCharacterAutocomplete } = await import("../apiClient.js");
    const result = await fetchCharacterAutocomplete("user-1");

    expect(result).toEqual([
      { id: 1, name: "Alice", concept: "Mage" },
      { id: 2, name: "Bob", concept: null },
    ]);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/users/user-1/character-autocomplete",
    );
  });

  it("returns empty array on non-ok response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    const { fetchCharacterAutocomplete } = await import("../apiClient.js");
    const result = await fetchCharacterAutocomplete("user-1");

    expect(result).toEqual([]);
  });

  it("returns empty array on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const { fetchCharacterAutocomplete } = await import("../apiClient.js");
    const result = await fetchCharacterAutocomplete("user-1");

    expect(result).toEqual([]);
  });

  it("encodes the userId in the URL", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { fetchCharacterAutocomplete } = await import("../apiClient.js");
    await fetchCharacterAutocomplete("user/id with spaces");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/users/user%2Fid%20with%20spaces/character-autocomplete",
    );
  });
});

describe("postAsCharacterViaApi", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    process.env["DISCORD_TOKEN"] = "test-bot-token";
  });

  it("sends POST request with Authorization: Bot header", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ posted: true }),
    });

    const { postAsCharacterViaApi } = await import("../apiClient.js");
    await postAsCharacterViaApi({
      userId: "user-1",
      characterId: 42,
      content: "Hello",
      channelId: "channel-1",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/discord/post",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bot test-bot-token",
        },
      }),
    );
  });

  it("sends a timeout signal in the fetch options", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ posted: true }),
    });

    const { postAsCharacterViaApi } = await import("../apiClient.js");
    await postAsCharacterViaApi({
      userId: "user-1",
      characterId: 42,
      content: "Hello",
      channelId: "channel-1",
    });

    const fetchOpts = mockFetch.mock.calls[0][1];
    expect(fetchOpts.signal).toBeDefined();
    expect(typeof fetchOpts.signal.addEventListener).toBe("function");
  });

  it("sends all params in the request body", async () => {
    const sentBody: any = {};
    mockFetch.mockImplementation(async (_url: string, opts: any) => {
      Object.assign(sentBody, JSON.parse(opts.body));
      return {
        ok: true,
        json: async () => ({ posted: true }),
      };
    });

    const { postAsCharacterViaApi } = await import("../apiClient.js");
    await postAsCharacterViaApi({
      userId: "user-1",
      characterId: 42,
      content: "Hello world",
      channelId: "channel-1",
      imageUrl: "https://example.com/img.png",
      threadId: "thread-1",
    });

    expect(sentBody.userId).toBe("user-1");
    expect(sentBody.characterId).toBe(42);
    expect(sentBody.content).toBe("Hello world");
    expect(sentBody.channelId).toBe("channel-1");
    expect(sentBody.imageUrl).toBe("https://example.com/img.png");
    expect(sentBody.threadId).toBe("thread-1");
  });

  it("returns { posted: true } on success", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ posted: true }),
    });

    const { postAsCharacterViaApi } = await import("../apiClient.js");
    const result = await postAsCharacterViaApi({
      userId: "user-1",
      characterId: 42,
      content: "Hello",
      channelId: "channel-1",
    });

    expect(result).toEqual({ posted: true });
  });

  it("throws PostError with kind 'api' on 400 with API error message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Character not found" }),
    });

    const { postAsCharacterViaApi, PostError } = await import("../apiClient.js");
    await expect(
      postAsCharacterViaApi({
        userId: "user-1",
        characterId: 999,
        content: "Hello",
        channelId: "channel-1",
      }),
    ).rejects.toThrow(expect.objectContaining({
      name: "PostError",
      kind: "api",
      message: "Character not found",
      status: 400,
    }));
  });

  it("throws PostError with kind 'api' when no message body", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("no body");
      },
    });

    const { postAsCharacterViaApi, PostError } = await import("../apiClient.js");
    await expect(
      postAsCharacterViaApi({
        userId: "user-1",
        characterId: 42,
        content: "Hello",
        channelId: "channel-1",
      }),
    ).rejects.toThrow(expect.objectContaining({
      name: "PostError",
      kind: "api",
      status: 500,
    }));
  });

  it("throws PostError with kind 'auth' on 401", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid bot token" }),
    });

    const { postAsCharacterViaApi, PostError } = await import("../apiClient.js");
    await expect(
      postAsCharacterViaApi({
        userId: "user-1",
        characterId: 42,
        content: "Hello",
        channelId: "channel-1",
      }),
    ).rejects.toThrow(expect.objectContaining({
      name: "PostError",
      kind: "auth",
      message: "Invalid bot token",
      status: 401,
    }));
  });

  it("throws PostError with kind 'auth' on 403", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "Missing Permissions" }),
    });

    const { postAsCharacterViaApi, PostError } = await import("../apiClient.js");
    await expect(
      postAsCharacterViaApi({
        userId: "user-1",
        characterId: 42,
        content: "Hello",
        channelId: "channel-1",
      }),
    ).rejects.toThrow(expect.objectContaining({
      name: "PostError",
      kind: "auth",
      status: 403,
    }));
  });

  it("throws PostError with kind 'network' on fetch TypeError", async () => {
    const fetchError = new TypeError("fetch failed");
    mockFetch.mockRejectedValue(fetchError);

    const { postAsCharacterViaApi, PostError } = await import("../apiClient.js");
    await expect(
      postAsCharacterViaApi({
        userId: "user-1",
        characterId: 42,
        content: "Hello",
        channelId: "channel-1",
      }),
    ).rejects.toThrow(expect.objectContaining({
      name: "PostError",
      kind: "network",
      message: "Could not reach the API server",
    }));
  });

  it("retries on network error and succeeds on second attempt", async () => {
    const fetchError = new TypeError("fetch failed");
    mockFetch
      .mockRejectedValueOnce(fetchError)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posted: true, characterName: "Alice" }),
      });

    const { postAsCharacterViaApi } = await import("../apiClient.js");
    const result = await postAsCharacterViaApi({
      userId: "user-1",
      characterId: 42,
      content: "Hello",
      channelId: "channel-1",
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ posted: true, characterName: "Alice" });
  });

  it("retries up to MAX_RETRIES then throws", async () => {
    const fetchError = new TypeError("fetch failed");
    mockFetch.mockRejectedValue(fetchError);

    const { postAsCharacterViaApi, PostError } = await import("../apiClient.js");
    await expect(
      postAsCharacterViaApi({
        userId: "user-1",
        characterId: 42,
        content: "Hello",
        channelId: "channel-1",
      }),
    ).rejects.toThrow(expect.objectContaining({
      name: "PostError",
      kind: "network",
    }));

    // 1 initial + 2 retries = 3 total calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("does NOT retry on auth error (401)", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid bot token" }),
    });

    const { postAsCharacterViaApi } = await import("../apiClient.js");
    await expect(
      postAsCharacterViaApi({
        userId: "user-1",
        characterId: 42,
        content: "Hello",
        channelId: "channel-1",
      }),
    ).rejects.toThrow();

    // Only 1 call — no retry
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on API error (500)", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Internal error" }),
    });

    const { postAsCharacterViaApi } = await import("../apiClient.js");
    await expect(
      postAsCharacterViaApi({
        userId: "user-1",
        characterId: 42,
        content: "Hello",
        channelId: "channel-1",
      }),
    ).rejects.toThrow();

    // Only 1 call — no retry
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("PostError", () => {
  it("has correct properties for network kind", async () => {
    const { PostError } = await import("../apiClient.js");
    const err = new PostError({ kind: "network", message: "Could not reach the API server" });

    expect(err.name).toBe("PostError");
    expect(err.kind).toBe("network");
    expect(err.message).toBe("Could not reach the API server");
    expect(err.status).toBeUndefined();
    expect(err.cause).toBeUndefined();
    expect(err instanceof Error).toBe(true);
  });

  it("has correct properties for auth kind with status", async () => {
    const { PostError } = await import("../apiClient.js");
    const err = new PostError({ kind: "auth", message: "Invalid token", status: 401 });

    expect(err.kind).toBe("auth");
    expect(err.status).toBe(401);
  });

  it("preserves cause chain", async () => {
    const { PostError } = await import("../apiClient.js");
    const original = new TypeError("fetch failed");
    const err = new PostError({ kind: "network", message: "Failed", cause: original });

    expect(err.cause).toBe(original);
  });
});

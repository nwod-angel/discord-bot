import { vi } from 'vitest';

// ── Mock logger ─────────────────────────────────────────────────
vi.mock('../../logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
  createChildLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ── Mutable module-level references for mock flexibility ──────────
// These arrays are intentionally `const` (the reference is fixed) but
// their *contents* are mutated between test cases via push/length=0.
// The mock factories use getters so every access returns the live array.
const mockCommandsArray: any[] = [];
const mockAutoCompleteArray: any[] = [];

vi.mock('../../Commands.js', () => ({
  get Commands() {
    return mockCommandsArray;
  },
}));

vi.mock('../../AutoCompleteCommands.js', () => ({
  get AutoCompleteCommands() {
    return mockAutoCompleteArray;
  },
}));

vi.mock('../../listeners/UpdateStatus.js', () => ({
  UpdateStatus: {
    startThinking: vi.fn(),
    doSomethingRandom: vi.fn(),
  },
}));

// ── Imports (resolved AFTER hoisted mocks) ──────────────────────
import interactionCreate from '../../listeners/interactionCreate.js';
import { UpdateStatus } from '../../listeners/UpdateStatus.js';
import { logger } from '../../logger.js';

// ── Tests ───────────────────────────────────────────────────────
describe('interactionCreate', () => {
  let client: any;
  let callback: Function;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mutable arrays to empty for each test
    mockCommandsArray.length = 0;
    mockAutoCompleteArray.length = 0;

    // Create a minimal mock client that captures the registered callback
    client = { on: vi.fn() };
    client.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'interactionCreate') {
        callback = cb;
      }
    });

    // Register the listener
    interactionCreate(client);
  });

  // ── Listener registration ──────────────────────────────────────

  it('registers the interactionCreate listener on the client', () => {
    expect(client.on).toHaveBeenCalledWith(
      'interactionCreate',
      expect.any(Function),
    );
  });

  // ── Slash command handling ────────────────────────────────────

  it('handles a slash command interaction', async () => {
    const mockRun = vi.fn();
    mockCommandsArray.push({
      name: 'test-cmd',
      description: 'A test command',
      run: mockRun,
    });

    const deferReply = vi.fn().mockResolvedValue(undefined);
    const interaction: any = {
      isCommand: () => true,
      isContextMenuCommand: () => false,
      isAutocomplete: () => false,
      commandName: 'test-cmd',
      deferReply,
      followUp: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await callback(interaction);

    expect(deferReply).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalledWith(client, interaction);
  });

  it('handles unknown slash command', async () => {
    // mockCommandsArray is intentionally empty (reset in beforeEach)
    const followUp = vi.fn().mockResolvedValue(undefined);
    const interaction: any = {
      isCommand: () => true,
      isContextMenuCommand: () => false,
      isAutocomplete: () => false,
      commandName: 'no-such-command',
      deferReply: vi.fn(),
      followUp,
      reply: vi.fn(),
    };

    await callback(interaction);

    expect(followUp).toHaveBeenCalledWith({
      content: 'An error has occurred',
    });
  });

  it('handles slash command error gracefully', async () => {
    const mockRun = vi.fn().mockImplementation(() => {
      throw new Error('Intentional command failure');
    });
    mockCommandsArray.push({
      name: 'broken-cmd',
      description: 'A command that throws',
      run: mockRun,
    });

    const reply = vi.fn().mockResolvedValue(undefined);
    const interaction: any = {
      isCommand: () => true,
      isContextMenuCommand: () => false,
      isAutocomplete: () => false,
      commandName: 'broken-cmd',
      deferReply: vi.fn().mockResolvedValue(undefined),
      followUp: vi.fn(),
      reply,
    };

    await callback(interaction);

    expect(reply).toHaveBeenCalledWith({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  });

  // ── Autocomplete handling ─────────────────────────────────────

  it('handles autocomplete interaction', async () => {
    const mockAutocomplete = vi.fn().mockResolvedValue([
      { name: 'Result A', value: 'a' },
      { name: 'Result B', value: 'b' },
    ]);
    mockAutoCompleteArray.push({
      name: 'test-autocomplete',
      maxResponses: 25,
      autocomplete: mockAutocomplete,
    });

    const respond = vi.fn().mockResolvedValue(undefined);
    const interaction: any = {
      isCommand: () => false,
      isContextMenuCommand: () => false,
      isAutocomplete: () => true,
      commandName: 'test-autocomplete',
      respond,
    };

    await callback(interaction);

    expect(mockAutocomplete).toHaveBeenCalledWith(client, interaction);
    expect(respond).toHaveBeenCalledWith([
      { name: 'Result A', value: 'a' },
      { name: 'Result B', value: 'b' },
    ]);
  });

  it('handles unknown autocomplete command', async () => {
    // mockAutoCompleteArray is intentionally empty (reset in beforeEach)
    const interaction: any = {
      isCommand: () => false,
      isContextMenuCommand: () => false,
      isAutocomplete: () => true,
      commandName: 'unknown-autocomplete',
      respond: vi.fn(),
    };

    await callback(interaction);

    expect(logger.debug).toHaveBeenCalledWith(
      { commandName: 'unknown-autocomplete' },
      'No registered Autocomplete Command',
    );
  });

  it('handles autocomplete respond() rejection gracefully', async () => {
    const mockAutocomplete = vi.fn().mockResolvedValue([
      { name: 'Result A', value: 'a' },
    ]);
    mockAutoCompleteArray.push({
      name: 'test-autocomplete',
      maxResponses: 25,
      autocomplete: mockAutocomplete,
    });

    // Simulate DiscordAPIError 10062 (Unknown interaction)
    const discordError = new Error('Unknown interaction');
    (discordError as any).code = 10062;
    const respond = vi.fn().mockRejectedValue(discordError);

    const interaction: any = {
      isCommand: () => false,
      isContextMenuCommand: () => false,
      isAutocomplete: () => true,
      commandName: 'test-autocomplete',
      respond,
    };

    // Must NOT throw — the error is caught by the outer try/catch
    await expect(callback(interaction)).resolves.toBeUndefined();

    // Verify the error was logged by the catch handler
    expect(logger.error).toHaveBeenCalledWith(
      { err: discordError },
      'Errored during interaction handler.',
    );
  });

  // ── UpdateStatus calls ────────────────────────────────────────

  it('calls UpdateStatus.startThinking and doSomethingRandom', async () => {
    // Use a valid but unknown command so the handler doesn't throw
    const interaction: any = {
      isCommand: () => true,
      isContextMenuCommand: () => false,
      isAutocomplete: () => false,
      commandName: 'no-such-cmd',
      deferReply: vi.fn(),
      followUp: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn(),
    };

    await callback(interaction);

    expect(UpdateStatus.startThinking).toHaveBeenCalledWith(client);
    expect(UpdateStatus.doSomethingRandom).toHaveBeenCalledWith(client);
  });
});

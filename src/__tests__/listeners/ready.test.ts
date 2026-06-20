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

// ── Mock Commands and UpdateStatus at module level ───────────────
vi.mock('../../Commands.js', () => ({
  loadCommands: vi.fn().mockResolvedValue([
    { name: 'hello', description: 'Returns a greeting' },
    { name: 'roll', description: 'Rolls dice' },
  ]),
}));

vi.mock('../../listeners/UpdateStatus.js', () => ({
  UpdateStatus: {
    doSomethingRandom: vi.fn(),
  },
}));

// ── Imports (resolved AFTER hoisted mocks) ──────────────────────
import ready from '../../listeners/ready.js';
import { UpdateStatus } from '../../listeners/UpdateStatus.js';
import { logger } from '../../logger.js';

// ── Tests ───────────────────────────────────────────────────────
describe('ready', () => {
  let client: any;
  let callback: Function;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a minimal mock client that captures the registered callback
    client = {
      user: { username: 'TestBot' },
      application: {
        commands: { set: vi.fn().mockResolvedValue(undefined) },
      },
      on: vi.fn(),
    };
    client.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'ready') {
        callback = cb;
      }
    });

    ready(client);
  });

  // ── Listener registration ──────────────────────────────────────

  it('registers the ready listener on the client', () => {
    expect(client.on).toHaveBeenCalledWith('ready', expect.any(Function));
  });

  // ── Normal startup path ────────────────────────────────────────

  it('registers slash commands when ready fires', async () => {
    await callback();

    expect(client.application.commands.set).toHaveBeenCalledTimes(1);
    expect(client.application.commands.set).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'hello' }),
        expect.objectContaining({ name: 'roll' }),
      ]),
    );
  });

  it('logs the bot username when ready fires', async () => {
    await callback();

    expect(logger.info).toHaveBeenCalledWith(
      { username: 'TestBot' },
      'Bot is online',
    );
  });

  // ── Early return guards ────────────────────────────────────────

  it('early returns when client.user is null', async () => {
    client.user = null;

    await callback();

    expect(client.application.commands.set).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('early returns when client.application is null', async () => {
    client.application = null;

    await callback();

    // Cannot assert commands.set when application is null (no such property)
    expect(logger.info).not.toHaveBeenCalled();
  });

  // ── UpdateStatus calls ─────────────────────────────────────────

  it('calls UpdateStatus.doSomethingRandom', async () => {
    await callback();

    expect(UpdateStatus.doSomethingRandom).toHaveBeenCalledWith(client);
  });
});

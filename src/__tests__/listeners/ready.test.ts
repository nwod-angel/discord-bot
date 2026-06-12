// ── Mock logger ─────────────────────────────────────────────────
jest.mock('../../logger.js', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
  createChildLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// ── Mock Commands and UpdateStatus at module level ───────────────
jest.mock('../../Commands.js', () => ({
  Commands: [
    { name: 'hello', description: 'Returns a greeting' },
    { name: 'roll', description: 'Rolls dice' },
  ],
}));

jest.mock('../../listeners/UpdateStatus.js', () => ({
  UpdateStatus: {
    doSomethingRandom: jest.fn(),
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
    jest.clearAllMocks();

    // Create a minimal mock client that captures the registered callback
    client = {
      user: { username: 'TestBot' },
      application: {
        commands: { set: jest.fn().mockResolvedValue(undefined) },
      },
      on: jest.fn(),
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

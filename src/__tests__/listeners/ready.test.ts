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
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await callback();

    expect(logSpy).toHaveBeenCalledWith('TestBot is online');

    logSpy.mockRestore();
  });

  // ── Early return guards ────────────────────────────────────────

  it('early returns when client.user is null', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    client.user = null;

    await callback();

    expect(client.application.commands.set).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it('early returns when client.application is null', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    client.application = null;

    await callback();

    // Cannot assert commands.set when application is null (no such property)
    expect(logSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });

  // ── UpdateStatus calls ─────────────────────────────────────────

  it('calls UpdateStatus.doSomethingRandom', async () => {
    await callback();

    expect(UpdateStatus.doSomethingRandom).toHaveBeenCalledWith(client);
  });
});

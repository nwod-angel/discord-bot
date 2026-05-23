// ── Imports ─────────────────────────────────────────────────────
import unhandledException from '../../listeners/unhandledException.js';

// ── Tests ───────────────────────────────────────────────────────
describe('unhandledException', () => {
  let client: any;
  let callback: Function;

  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create a minimal mock client that captures the registered callback
    client = { on: jest.fn() };
    client.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'unhandledException') {
        callback = cb;
      }
    });

    unhandledException(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Listener registration ──────────────────────────────────────

  it('registers the unhandledException listener on the client', () => {
    expect(client.on).toHaveBeenCalledWith(
      'unhandledException',
      expect.any(Function),
    );
  });

  // ── Error logging ──────────────────────────────────────────────

  it('logs errors when unhandledException fires', () => {
    const error = new Error('Critical failure');

    callback(error);

    expect(console.error).toHaveBeenCalledWith('Unhandled exception:', error);
  });

  it('logs Date.now() when unhandledException fires', () => {
    const error = new Error('Test error');

    callback(error);

    expect(console.log).toHaveBeenCalledWith(expect.any(Number));
  });
});

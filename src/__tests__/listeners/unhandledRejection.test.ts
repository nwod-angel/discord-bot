// ── Imports ─────────────────────────────────────────────────────
import unhandledRejection from '../../listeners/unhandledRejection.js';

// ── Tests ───────────────────────────────────────────────────────
describe('unhandledRejection', () => {
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
      if (event === 'unhandledRejection') {
        callback = cb;
      }
    });

    unhandledRejection(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Listener registration ──────────────────────────────────────

  it('registers the unhandledRejection listener on the client', () => {
    expect(client.on).toHaveBeenCalledWith(
      'unhandledRejection',
      expect.any(Function),
    );
  });

  // ── Error logging ──────────────────────────────────────────────

  it('logs errors when unhandledRejection fires', () => {
    const error = new Error('Something went wrong');

    callback(error);

    expect(console.error).toHaveBeenCalledWith(
      'Unhandled promise rejection:',
      error,
    );
  });

  it('logs Date.now() when unhandledRejection fires', () => {
    const error = new Error('Test error');

    callback(error);

    expect(console.log).toHaveBeenCalledWith(expect.any(Number));
  });
});

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

// ── Imports ─────────────────────────────────────────────────────
import unhandledException from '../../listeners/unhandledException.js';
import { logger } from '../../logger.js';

// ── Tests ───────────────────────────────────────────────────────
describe('unhandledException', () => {
  let client: any;
  let callback: Function;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a minimal mock client that captures the registered callback
    client = { on: jest.fn() };
    client.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'unhandledException') {
        callback = cb;
      }
    });

    unhandledException(client);
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

    expect(logger.error).toHaveBeenCalledWith(
      { err: error },
      'Unhandled exception',
    );
  });
});

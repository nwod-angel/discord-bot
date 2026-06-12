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
import unhandledRejection from '../../listeners/unhandledRejection.js';
import { logger } from '../../logger.js';

// ── Tests ───────────────────────────────────────────────────────
describe('unhandledRejection', () => {
  let client: any;
  let callback: Function;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a minimal mock client that captures the registered callback
    client = { on: jest.fn() };
    client.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'unhandledRejection') {
        callback = cb;
      }
    });

    unhandledRejection(client);
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

    expect(logger.error).toHaveBeenCalledWith(
      { err: error },
      'Unhandled promise rejection',
    );
  });
});

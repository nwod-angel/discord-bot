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

// ── Imports ─────────────────────────────────────────────────────
import unhandledException from '../../listeners/unhandledException.js';
import { logger } from '../../logger.js';

// ── Tests ───────────────────────────────────────────────────────
describe('unhandledException', () => {
  let client: any;
  let callback: Function;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a minimal mock client that captures the registered callback
    client = { on: vi.fn() };
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

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
import unhandledRejection from '../../listeners/unhandledRejection.js';
import { logger } from '../../logger.js';

// ── Tests ───────────────────────────────────────────────────────
describe('unhandledRejection', () => {
  let client: any;
  let callback: Function;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a minimal mock client that captures the registered callback
    client = { on: vi.fn() };
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

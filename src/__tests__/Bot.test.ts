import { vi } from 'vitest';

// ── Mock logger ─────────────────────────────────────────────────
vi.mock('../logger.js', () => ({
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

// ── Mock side-effect modules before importing Bot.ts ─────────────

const mockConfig = vi.fn();
vi.mock('dotenv', () => ({
  config: mockConfig,
}));

const mockLogin = vi.fn().mockResolvedValue(undefined);
const mockClientInstance = {
  login: mockLogin,
  on: vi.fn(),
  once: vi.fn(),
  user: null,
  application: null,
};

vi.mock('discord.js', () => ({
  Client: vi.fn().mockImplementation(() => mockClientInstance),
}));

// Mock listener modules — capture the function each exports as default
const mockReady = vi.fn();
const mockInteractionCreate = vi.fn();
const mockUnhandledRejection = vi.fn();
const mockUnhandledException = vi.fn();

vi.mock('../listeners/ready.js', () => ({
  __esModule: true,
  default: mockReady,
}));
vi.mock('../listeners/interactionCreate.js', () => ({
  __esModule: true,
  default: mockInteractionCreate,
}));
vi.mock('../listeners/unhandledRejection.js', () => ({
  __esModule: true,
  default: mockUnhandledRejection,
}));
vi.mock('../listeners/unhandledException.js', () => ({
  __esModule: true,
  default: mockUnhandledException,
}));

// Mock the BitInt polyfill (side-effect import)
vi.mock('../typescript/BitInt', () => ({}));

// Mock instrumentation to prevent side effects
vi.mock('../instrumentation.js', () => ({}));

// ── Imports ─────────────────────────────────────────────────────
import { logger } from '../logger.js';

// ── Tests ───────────────────────────────────────────────────────
describe('Bot', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...process.env };

    // Set required env vars
    process.env['DISCORD_TOKEN'] = 'test-token-123';
    process.env['USE_API_ROLL'] = 'false';
    process.env['API_BASE_URL'] = 'http://localhost:3001';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  /**
   * Import Bot.ts in isolation so its top-level side effects run
   * against our mocks. Each test gets a fresh module evaluation.
   */
  async function loadBot() {
    vi.resetModules();
    await import('../Bot.js');
  }

  // ── dotenv initialization ─────────────────────────────────────

  it('calls dotenv.config() on startup', async () => {
    await loadBot();
    expect(mockConfig).toHaveBeenCalledTimes(1);
  });

  // ── Client creation ───────────────────────────────────────────

  it('creates a Discord Client with empty intents', async () => {
    const { Client } = await import('discord.js');
    await loadBot();
    expect(Client).toHaveBeenCalledWith({ intents: [] });
  });

  // ── Listener registration ─────────────────────────────────────

  it('registers the ready listener with the client', async () => {
    await loadBot();
    expect(mockReady).toHaveBeenCalledWith(mockClientInstance);
  });

  it('registers the interactionCreate listener with the client', async () => {
    await loadBot();
    expect(mockInteractionCreate).toHaveBeenCalledWith(mockClientInstance);
  });

  it('registers the unhandledRejection listener with the client', async () => {
    await loadBot();
    expect(mockUnhandledRejection).toHaveBeenCalledWith(mockClientInstance);
  });

  it('registers the unhandledException listener with the client', async () => {
    await loadBot();
    expect(mockUnhandledException).toHaveBeenCalledWith(mockClientInstance);
  });

  // ── Login ─────────────────────────────────────────────────────

  it('calls client.login with the DISCORD_TOKEN', async () => {
    await loadBot();
    expect(mockLogin).toHaveBeenCalledWith('test-token-123');
  });

  // ── checkApiHealth ────────────────────────────────────────────

  it('logs API delegation disabled when USE_API_ROLL is off', async () => {
    process.env['USE_API_ROLL'] = 'false';

    await loadBot();

    expect(logger.debug).toHaveBeenCalledWith(
      'USE_API_ROLL is off — API delegation disabled.',
    );
  });

  it('checks API health when USE_API_ROLL is true', async () => {
    process.env['USE_API_ROLL'] = 'true';
    process.env['API_BASE_URL'] = 'http://localhost:3001';

    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = mockFetch;

    await loadBot();

    // checkApiHealth is async — wait for it to complete
    await new Promise((r) => setTimeout(r, 50));

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/health',
      expect.objectContaining({ method: 'GET' }),
    );

    delete (global as any).fetch;
  });

  it('handles API health check failure gracefully', async () => {
    process.env['USE_API_ROLL'] = 'true';
    process.env['API_BASE_URL'] = 'http://localhost:3001';

    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    global.fetch = mockFetch;

    await loadBot();

    // Wait for async checkApiHealth to complete
    await new Promise((r) => setTimeout(r, 50));

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'API unreachable — will fall back to local rolls.',
    );

    delete (global as any).fetch;
  });
});

// ── Mock logger ─────────────────────────────────────────────────
jest.mock('../logger.js', () => ({
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

// ── Mock side-effect modules before importing Bot.ts ─────────────

const mockConfig = jest.fn();
jest.mock('dotenv', () => ({
  config: mockConfig,
}));

const mockLogin = jest.fn().mockResolvedValue(undefined);
const mockClientInstance = {
  login: mockLogin,
  on: jest.fn(),
  once: jest.fn(),
  user: null,
  application: null,
};

jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => mockClientInstance),
}));

// Mock listener modules — capture the function each exports as default
const mockReady = jest.fn();
const mockInteractionCreate = jest.fn();
const mockUnhandledRejection = jest.fn();
const mockUnhandledException = jest.fn();

jest.mock('../listeners/ready.js', () => ({
  __esModule: true,
  default: mockReady,
}));
jest.mock('../listeners/interactionCreate.js', () => ({
  __esModule: true,
  default: mockInteractionCreate,
}));
jest.mock('../listeners/unhandledRejection.js', () => ({
  __esModule: true,
  default: mockUnhandledRejection,
}));
jest.mock('../listeners/unhandledException.js', () => ({
  __esModule: true,
  default: mockUnhandledException,
}));

// Mock the BitInt polyfill (side-effect import)
jest.mock('../typescript/BitInt', () => ({}));

// Mock instrumentation to prevent side effects
jest.mock('../instrumentation.js', () => ({}));

// ── Imports ─────────────────────────────────────────────────────
import { logger } from '../logger.js';

// ── Tests ───────────────────────────────────────────────────────
describe('Bot', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
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
  function loadBot() {
    jest.isolateModules(() => {
      require('../Bot.js');
    });
  }

  // ── dotenv initialization ─────────────────────────────────────

  it('calls dotenv.config() on startup', () => {
    loadBot();
    expect(mockConfig).toHaveBeenCalledTimes(1);
  });

  // ── Client creation ───────────────────────────────────────────

  it('creates a Discord Client with empty intents', () => {
    const { Client } = require('discord.js');
    loadBot();
    expect(Client).toHaveBeenCalledWith({ intents: [] });
  });

  // ── Listener registration ─────────────────────────────────────

  it('registers the ready listener with the client', () => {
    loadBot();
    expect(mockReady).toHaveBeenCalledWith(mockClientInstance);
  });

  it('registers the interactionCreate listener with the client', () => {
    loadBot();
    expect(mockInteractionCreate).toHaveBeenCalledWith(mockClientInstance);
  });

  it('registers the unhandledRejection listener with the client', () => {
    loadBot();
    expect(mockUnhandledRejection).toHaveBeenCalledWith(mockClientInstance);
  });

  it('registers the unhandledException listener with the client', () => {
    loadBot();
    expect(mockUnhandledException).toHaveBeenCalledWith(mockClientInstance);
  });

  // ── Login ─────────────────────────────────────────────────────

  it('calls client.login with the DISCORD_TOKEN', () => {
    loadBot();
    expect(mockLogin).toHaveBeenCalledWith('test-token-123');
  });

  // ── checkApiHealth ────────────────────────────────────────────

  it('logs API delegation disabled when USE_API_ROLL is off', () => {
    process.env['USE_API_ROLL'] = 'false';

    loadBot();

    expect(logger.debug).toHaveBeenCalledWith(
      'USE_API_ROLL is off — API delegation disabled.',
    );
  });

  it('checks API health when USE_API_ROLL is true', async () => {
    process.env['USE_API_ROLL'] = 'true';
    process.env['API_BASE_URL'] = 'http://localhost:3001';

    const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = mockFetch;

    loadBot();

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

    const mockFetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    global.fetch = mockFetch;

    loadBot();

    // Wait for async checkApiHealth to complete
    await new Promise((r) => setTimeout(r, 50));

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'API unreachable — will fall back to local rolls.',
    );

    delete (global as any).fetch;
  });
});

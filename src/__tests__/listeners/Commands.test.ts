import { vi } from 'vitest';

// ── Mock external ESM packages that cannot parse ───────────
vi.mock('@nwod-angel/nwod-core', () => {
  // Rule must be a real (extendable) class because RuleDefinition extends it
  class Rule {
    constructor(sources?: any[]) {}
  }
  return {
    Arcana: {},
    ArcanaType: {},
    Practice: {},
    PracticeType: {},
    Requirement: vi.fn(),
    Source: vi.fn(),
    MeritDefinition: vi.fn(),
    Spell: vi.fn().mockImplementation(() => ({ dots: () => 1 })),
    Rule,
    NwodSymbols: vi.fn().mockImplementation(() => ({
      SpellArcanaDots: '●',
      Dot: '●',
      DotLarge: '⬤',
      DotLargeWhite: '◯',
      DotLargeBlack: '⬤',
      Arrow: '→',
    })),
  };
});

vi.mock('@nwod-angel/nwod-roller', () => ({
  InstantRoll: vi.fn(),
  ExtendedRoll: vi.fn(),
  RollResult: {
    critical_failure: -1,
    failure: 0,
    success: 1,
    exceptional_success: 2,
  },
}));

vi.mock('@discordjs/rest', () => ({
  REST: vi.fn().mockImplementation(() => ({
    setToken: vi.fn().mockReturnThis(),
    put: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('discord-api-types/v9', () => ({
  Routes: {
    applicationGuildCommands: vi.fn(
      (clientId: string, guildId: string) =>
        `/applications/${clientId}/guilds/${guildId}/commands`,
    ),
  },
}));

// ── Mock local modules with heavy data or side effects ──────────
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

vi.mock('../../data/SpellProvider.js', () => ({
  __esModule: true,
  default: {
    spells: [],
    getSpells: vi.fn(),
    _initialize: undefined,
  },
}));

vi.mock('../../data/MeritProvider.js', () => ({
  __esModule: true,
  default: {
    merits: [],
    getMerits: vi.fn(),
    _initialize: undefined,
  },
}));

// ── Imports (resolved AFTER hoisted mocks) ──────────────────────
import { loadCommands } from '../../Commands.js';

// ── Tests ───────────────────────────────────────────────────────
describe('Commands', () => {
  it('loads a non-empty array', async () => {
    const commands = await loadCommands();
    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBeGreaterThan(0);
  });

  it('each command has required properties', async () => {
    const commands = await loadCommands();
    commands.forEach((cmd) => {
      expect(cmd).toHaveProperty('name');
      expect(typeof cmd.name).toBe('string');
      expect(cmd.name.length).toBeGreaterThan(0);

      expect(cmd).toHaveProperty('description');
      expect(typeof cmd.description).toBe('string');

      expect(cmd).toHaveProperty('run');
      expect(typeof cmd.run).toBe('function');
    });
  });

  it('contains expected commands by name', async () => {
    const commands = await loadCommands();
    const names = commands.map((c) => c.name);
    expect(names).toContain('hello');
    expect(names).toContain('roll');
    expect(names).toContain('goodbye');
    expect(names).toContain('spell');
    expect(names).toContain('merit');
    expect(names).toContain('rule');
    expect(names).toContain('table');
    expect(names).toContain('paradox');
    expect(names).toContain('cast');
    expect(names).toContain('attack');
  });
});

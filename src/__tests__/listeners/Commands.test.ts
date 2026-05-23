// ── Mock external ESM packages that Jest cannot parse ───────────
jest.mock('@nwod-angel/nwod-core', () => {
  // Rule must be a real (extendable) class because RuleDefinition extends it
  class Rule {
    constructor(sources?: any[]) {}
  }
  return {
    Arcana: {},
    ArcanaType: {},
    Practice: {},
    PracticeType: {},
    Requirement: jest.fn(),
    Source: jest.fn(),
    MeritDefinition: jest.fn(),
    Spell: jest.fn().mockImplementation(() => ({ dots: () => 1 })),
    Rule,
    NwodSymbols: jest.fn().mockImplementation(() => ({
      SpellArcanaDots: '●',
      Dot: '●',
      DotLarge: '⬤',
      DotLargeWhite: '◯',
      DotLargeBlack: '⬤',
      Arrow: '→',
    })),
  };
});

jest.mock('@nwod-angel/nwod-roller', () => ({
  InstantRoll: jest.fn(),
  ExtendedRoll: jest.fn(),
  RollResult: {
    critical_failure: -1,
    failure: 0,
    success: 1,
    exceptional_success: 2,
  },
}));

jest.mock('@discordjs/rest', () => ({
  REST: jest.fn().mockImplementation(() => ({
    setToken: jest.fn().mockReturnThis(),
    put: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('discord-api-types/v9', () => ({
  Routes: {
    applicationGuildCommands: jest.fn(
      (clientId: string, guildId: string) =>
        `/applications/${clientId}/guilds/${guildId}/commands`,
    ),
  },
}));

// ── Mock local modules with heavy data or side effects ──────────
jest.mock('../../DiscordChannelLogger.js', () => ({
  __esModule: true,
  default: {
    setClient: jest.fn().mockReturnThis(),
    logBaggage: jest.fn(),
  },
}));

jest.mock('../../data/SpellProvider.js', () => ({
  __esModule: true,
  default: {
    spells: [],
    getSpells: jest.fn(),
    _initialize: undefined,
  },
}));

jest.mock('../../data/MeritProvider.js', () => ({
  __esModule: true,
  default: {
    merits: [],
    getMerits: jest.fn(),
    _initialize: undefined,
  },
}));

// ── Imports (resolved AFTER hoisted mocks) ──────────────────────
import { Commands } from '../../Commands.js';

// ── Tests ───────────────────────────────────────────────────────
describe('Commands', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(Commands)).toBe(true);
    expect(Commands.length).toBeGreaterThan(0);
  });

  it('each command has required properties', () => {
    Commands.forEach((cmd, index) => {
      expect(cmd).toHaveProperty('name');
      expect(typeof cmd.name).toBe('string');
      expect(cmd.name.length).toBeGreaterThan(0);

      expect(cmd).toHaveProperty('description');
      expect(typeof cmd.description).toBe('string');

      expect(cmd).toHaveProperty('run');
      expect(typeof cmd.run).toBe('function');
    });
  });

  it('contains expected commands by name', () => {
    const names = Commands.map((c) => c.name);
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

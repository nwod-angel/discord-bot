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

// ── Mock local modules with heavy data or side effects ──────────
jest.mock('../../DiscordChannelLogger.js', () => ({
  __esModule: true,
  default: {
    setClient: jest.fn().mockReturnThis(),
    logBaggage: jest.fn(),
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

jest.mock('../../data/spells.js', () => ({
  __esModule: true,
  default: [],
}));

// ── Imports (resolved AFTER hoisted mocks) ──────────────────────
import { AutoCompleteCommands } from '../../AutoCompleteCommands.js';

// ── Tests ───────────────────────────────────────────────────────
describe('AutoCompleteCommands', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(AutoCompleteCommands)).toBe(true);
    expect(AutoCompleteCommands.length).toBeGreaterThan(0);
  });

  it('each command has required properties', () => {
    AutoCompleteCommands.forEach((cmd) => {
      expect(cmd).toHaveProperty('name');
      expect(typeof cmd.name).toBe('string');
      expect(cmd.name.length).toBeGreaterThan(0);

      expect(cmd).toHaveProperty('autocomplete');
      expect(typeof cmd.autocomplete).toBe('function');

      expect(cmd).toHaveProperty('maxResponses');
      expect(cmd.maxResponses).toBe(25);
    });
  });

  it('contains expected autocomplete handlers by name', () => {
    const names = AutoCompleteCommands.map((c) => c.name);
    expect(names).toContain('spell');
    expect(names).toContain('merit');
    expect(names).toContain('rule');
    expect(names).toContain('table');
    expect(names).toContain('roll');
  });
});

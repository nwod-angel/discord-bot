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

vi.mock('../../data/MeritProvider.js', () => ({
  __esModule: true,
  default: {
    merits: [],
    getMerits: vi.fn(),
    _initialize: undefined,
  },
}));

vi.mock('../../data/spells.js', () => ({
  __esModule: true,
  default: [],
}));

// ── Imports (resolved AFTER hoisted mocks) ──────────────────────
import { loadAutoCompleteCommands } from '../../AutoCompleteCommands.js';

// ── Tests ───────────────────────────────────────────────────────
describe('AutoCompleteCommands', () => {
  it('loads a non-empty array', async () => {
    const commands = await loadAutoCompleteCommands();
    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBeGreaterThan(0);
  });

  it('each command has required properties', async () => {
    const commands = await loadAutoCompleteCommands();
    commands.forEach((cmd) => {
      expect(cmd).toHaveProperty('name');
      expect(typeof cmd.name).toBe('string');
      expect(cmd.name.length).toBeGreaterThan(0);

      expect(cmd).toHaveProperty('autocomplete');
      expect(typeof cmd.autocomplete).toBe('function');

      expect(cmd).toHaveProperty('maxResponses');
      expect(cmd.maxResponses).toBe(25);
    });
  });

  it('contains expected autocomplete handlers by name', async () => {
    const commands = await loadAutoCompleteCommands();
    const names = commands.map((c) => c.name);
    expect(names).toContain('spell');
    expect(names).toContain('merit');
    expect(names).toContain('rule');
    expect(names).toContain('table');
    expect(names).toContain('roll');
  });
});

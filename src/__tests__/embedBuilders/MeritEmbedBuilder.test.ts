import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('discord.js', () => ({
  EmbedBuilder: vi.fn().mockImplementation(() => {
    const data: any = { fields: [], title: '', description: '', footer: { text: '' } };
    return {
      data,
      setTitle: vi.fn(function (this: any, title: string) { data.title = title; return this; }),
      setDescription: vi.fn(function (this: any, desc: string) { data.description = desc; return this; }),
      setFooter: vi.fn(function (this: any, footer: any) { data.footer = footer; return this; }),
      setColor: vi.fn(function (this: any, color: any) { data.color = color; return this; }),
      addFields: vi.fn(function (this: any, ...args: any[]) {
        for (const field of args) {
          if (Array.isArray(field)) { data.fields.push(...field); }
          else { data.fields.push(field); }
        }
        return this;
      }),
      toJSON: vi.fn().mockReturnValue({}),
    };
  }),
}));

vi.mock('@nwod-angel/nwod-core', () => ({
  NwodSymbols: vi.fn().mockImplementation(() => ({
    MeritDot: '•',
  })),
}));

vi.mock('../../logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

import { MeritEmbed } from '../../embedBuilders/MeritEmbedBuilder.js';

function createMockMerit(overrides: any = {}) {
  return {
    name: 'Ambidextrous',
    titleString: vi.fn().mockReturnValue('Ambidextrous (•)'),
    hasRequirements: vi.fn().mockReturnValue(true),
    requirementsString: vi.fn().mockReturnValue('None'),
    description: 'You are ambidextrous.',
    sourcesString: vi.fn().mockReturnValue('Core Rulebook p.48'),
    levels: [],
    ...overrides,
  };
}

describe('MeritEmbed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets title via merit.titleString()', () => {
    const merit = createMockMerit();
    const embed = new MeritEmbed(merit as any).build();
    expect(embed.data.title).toBe('Ambidextrous (•)');
  });

  it('adds Requirements field when merit has requirements', () => {
    const merit = createMockMerit({ hasRequirements: vi.fn().mockReturnValue(true) });
    const embed = new MeritEmbed(merit as any)
      .withRequirements()
      .build();
    const reqField = embed.data.fields.find((f: any) => f.name === 'Requirements');
    expect(reqField).toBeDefined();
  });

  it('does not add Requirements field when merit has no requirements', () => {
    const merit = createMockMerit({ hasRequirements: vi.fn().mockReturnValue(false) });
    const embed = new MeritEmbed(merit as any)
      .withRequirements()
      .build();
    const reqField = embed.data.fields.find((f: any) => f.name === 'Requirements');
    expect(reqField).toBeUndefined();
  });

  it('adds description as Effect field', () => {
    const merit = createMockMerit();
    const embed = new MeritEmbed(merit as any)
      .withDescription()
      .build();
    const effectField = embed.data.fields.find((f: any) => f.name.startsWith('Effect'));
    expect(effectField).toBeDefined();
    expect(effectField.value).toBe('You are ambidextrous.');
  });

  it('adds level descriptions', () => {
    const merit = createMockMerit({
      levels: [
        { name: 'Ambidextrous', level: 1, description: 'Use both hands.' },
        { name: 'Ambidextrous', level: 2, description: 'Use both hands better.' },
      ],
    });
    const embed = new MeritEmbed(merit as any)
      .withLevels()
      .build();
    const levelFields = embed.data.fields.filter((f: any) => f.name.includes('•'));
    expect(levelFields.length).toBe(2);
  });

  it('chunks long description', () => {
    const merit = createMockMerit({ description: 'A'.repeat(2500) });
    const embed = new MeritEmbed(merit as any)
      .withDescription()
      .build();
    const effectFields = embed.data.fields.filter((f: any) => f.name.startsWith('Effect'));
    expect(effectFields.length).toBe(3);
  });

  it('adds Sources field', () => {
    const merit = createMockMerit();
    const embed = new MeritEmbed(merit as any)
      .withSources()
      .build();
    const srcField = embed.data.fields.find((f: any) => f.name === 'Sources');
    expect(srcField).toBeDefined();
    expect(srcField.value).toBe('Core Rulebook p.48');
  });

  it('supports fluent chaining', () => {
    const merit = createMockMerit();
    const embed = new MeritEmbed(merit as any)
      .withRequirements()
      .withDescription()
      .withLevels()
      .withSources()
      .build();
    expect(embed.data.title).toBe('Ambidextrous (•)');
    expect(embed.data.fields.length).toBeGreaterThan(0);
  });
});

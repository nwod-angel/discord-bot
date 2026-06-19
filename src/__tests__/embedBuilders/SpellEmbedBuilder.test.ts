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

import { SpellEmbedBuilder } from '../../embedBuilders/SpellEmbedBuilder.js';
import { EmbedBuilder } from 'discord.js';

function createMockSpell(overrides: any = {}) {
  return {
    name: 'Fireball',
    titleString: vi.fn().mockReturnValue('Fireball (Forces 3)'),
    requirementsString: vi.fn().mockReturnValue('Forces •••'),
    practiceString: vi.fn().mockReturnValue('Weaving'),
    action: 'Instant',
    duration: 'Transitory',
    aspect: 'Hermetic',
    cost: '2 Mana',
    description: 'A ball of fire.',
    sourcesString: vi.fn().mockReturnValue('Core Rulebook p.123'),
    primaryArcana: 'Forces',
    requirements: [{ name: 'Forces', dots: 3 }],
    ...overrides,
  };
}

describe('SpellEmbedBuilder', () => {
  let embed: EmbedBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    embed = new EmbedBuilder();
  });

  it('sets title via spell.titleString()', () => {
    const spell = createMockSpell();
    SpellEmbedBuilder.buildSpellEmbed(spell as any, embed);
    expect(embed.data.title).toBe('Fireball (Forces 3)');
  });

  it('adds Requirements field when spell has requirements', () => {
    const spell = createMockSpell();
    SpellEmbedBuilder.buildSpellEmbed(spell as any, embed);
    const reqField = embed.data.fields.find((f: any) => f.name === 'Requirements');
    expect(reqField).toBeDefined();
    expect(reqField.value).toBe('Forces •••');
  });

  it('does not add Requirements field when spell has no requirements', () => {
    const spell = createMockSpell({ requirements: [], requirementsString: vi.fn().mockReturnValue('') });
    SpellEmbedBuilder.buildSpellEmbed(spell as any, embed);
    const reqField = embed.data.fields.find((f: any) => f.name === 'Requirements');
    expect(reqField).toBeUndefined();
  });

  it('adds Practice, Action, Duration, Aspect, Cost fields', () => {
    const spell = createMockSpell();
    SpellEmbedBuilder.buildSpellEmbed(spell as any, embed);
    const fieldNames = embed.data.fields.map((f: any) => f.name);
    expect(fieldNames).toContain('Practice');
    expect(fieldNames).toContain('Action');
    expect(fieldNames).toContain('Duration');
    expect(fieldNames).toContain('Aspect');
    expect(fieldNames).toContain('Cost');
  });

  it('chunks long description', () => {
    const spell = createMockSpell({ description: 'A'.repeat(2500) });
    SpellEmbedBuilder.buildSpellEmbed(spell as any, embed);
    const effectFields = embed.data.fields.filter((f: any) => f.name.startsWith('Effect'));
    expect(effectFields.length).toBe(3);
    expect(effectFields[0].name).toBe('Effect (1/3)');
    expect(effectFields[2].name).toBe('Effect (3/3)');
  });

  it('adds Sources field', () => {
    const spell = createMockSpell();
    SpellEmbedBuilder.buildSpellEmbed(spell as any, embed);
    const srcField = embed.data.fields.find((f: any) => f.name === 'Sources');
    expect(srcField).toBeDefined();
    expect(srcField.value).toBe('Core Rulebook p.123');
  });
});

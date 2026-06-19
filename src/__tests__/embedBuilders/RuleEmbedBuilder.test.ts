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

import { RuleEmbedBuilder } from '../../embedBuilders/RuleEmbedBuilder.js';
import { EmbedBuilder } from 'discord.js';

function createMockRule(overrides: any = {}) {
  return {
    name: 'Willpower',
    paragraphs: [
      { text: 'Willpower is a measure of determination.', prefix: 'Definition', example: false },
      { text: 'Example: spending willpower.', prefix: undefined, example: true },
    ],
    sourcesString: vi.fn().mockReturnValue('Core Rulebook p.50'),
    ...overrides,
  };
}

describe('RuleEmbedBuilder', () => {
  let embed: EmbedBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    embed = new EmbedBuilder();
  });

  describe('buildSingleRuleEmbed', () => {
    it('sets title from rule.name', () => {
      const rule = createMockRule();
      RuleEmbedBuilder.buildSingleRuleEmbed(rule as any, embed);
      expect(embed.data.title).toBe('Willpower');
    });

    it('adds paragraphs with prefix as field name', () => {
      const rule = createMockRule();
      RuleEmbedBuilder.buildSingleRuleEmbed(rule as any, embed);
      const defField = embed.data.fields.find((f: any) => f.name === 'Definition');
      expect(defField).toBeDefined();
      expect(defField.value).toBe('Willpower is a measure of determination.');
    });

    it('adds example paragraphs with italic formatting', () => {
      const rule = createMockRule();
      RuleEmbedBuilder.buildSingleRuleEmbed(rule as any, embed);
      const exField = embed.data.fields.find((f: any) => f.name === 'Example');
      expect(exField).toBeDefined();
      expect(exField.value).toBe('*Example: spending willpower.*');
    });

    it('adds Sources field', () => {
      const rule = createMockRule();
      RuleEmbedBuilder.buildSingleRuleEmbed(rule as any, embed);
      const srcField = embed.data.fields.find((f: any) => f.name === 'Sources');
      expect(srcField).toBeDefined();
      expect(srcField.value).toBe('Core Rulebook p.50');
    });

    it('chunks long paragraph text at 1024 chars', () => {
      const rule = createMockRule({
        paragraphs: [{ text: 'A'.repeat(2500), prefix: 'Long', example: false }],
      });
      RuleEmbedBuilder.buildSingleRuleEmbed(rule as any, embed);
      const longFields = embed.data.fields.filter((f: any) => f.name === 'Long');
      expect(longFields.length).toBe(3);
    });
  });

  describe('buildMultipleRulesEmbed', () => {
    it('sets title with Showing X of Y', () => {
      const rules = [
        createMockRule({ name: 'Rule One' }),
        createMockRule({ name: 'Rule Two' }),
      ];
      RuleEmbedBuilder.buildMultipleRulesEmbed(rules as any, 'Rule', undefined, embed);
      expect(embed.data.title).toBe('Showing 2 of 2');
    });

    it('adds search terms field', () => {
      const rules = [createMockRule({ name: 'Rule One' })];
      RuleEmbedBuilder.buildMultipleRulesEmbed(rules as any, 'Rule', 'test', embed);
      const searchField = embed.data.fields.find((f: any) => f.name === 'Search');
      expect(searchField).toBeDefined();
      expect(searchField.value).toContain('Name: Rule');
      expect(searchField.value).toContain('Search: test');
    });

    it('lists rule names', () => {
      const rules = [
        createMockRule({ name: 'Alpha' }),
        createMockRule({ name: 'Beta' }),
      ];
      RuleEmbedBuilder.buildMultipleRulesEmbed(rules as any, undefined, undefined, embed);
      const listField = embed.data.fields.find((f: any) => f.name.includes('Showing'));
      expect(listField.value).toContain('Alpha');
      expect(listField.value).toContain('Beta');
    });
  });
});

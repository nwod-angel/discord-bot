import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('discord.js', () => ({
  EmbedBuilder: vi.fn().mockImplementation(() => {
    const data: any = { fields: [], title: '', description: '', footer: { text: '' }, color: 0, thumbnail: '' };
    return {
      data,
      setTitle: vi.fn(function (this: any, title: string) { data.title = title; return this; }),
      setDescription: vi.fn(function (this: any, desc: string) { data.description = desc; return this; }),
      setFooter: vi.fn(function (this: any, footer: any) { data.footer = footer; return this; }),
      setColor: vi.fn(function (this: any, color: any) { data.color = color; return this; }),
      setThumbnail: vi.fn(function (this: any, url: string) { data.thumbnail = url; return this; }),
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
  Colors: { Default: 0, NotQuiteBlack: 0x23272a, Yellow: 0xffff00, Red: 0xff0000, Green: 0x00ff00 },
}));

import { resultPresentation, RollEmbed } from '../../embedBuilders/RollEmbedBuilder.js';

describe('RollEmbedBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resultPresentation', () => {
    it('returns Critical Failure for code 1', () => {
      expect(resultPresentation(1).label).toContain('Critical Failure');
    });

    it('returns Failure for code 2', () => {
      expect(resultPresentation(2).label).toContain('Failure');
    });

    it('returns Success for code 3', () => {
      expect(resultPresentation(3).label).toContain('Success');
    });

    it('returns Exceptional Success for code 4', () => {
      expect(resultPresentation(4).label).toContain('Exceptional Success');
    });

    it('returns default Roll for unknown code', () => {
      expect(resultPresentation(99).label).toContain('Roll');
    });
  });

  describe('RollEmbed', () => {
    it('sets title with actionResult and description', () => {
      const embed = new RollEmbed({
        actionResult: '✅ Success',
        description: '*Attack*',
        name: 'Alice',
        dicePool: 5,
        successes: 3,
        rollDescription: 'Rolled 5 dice',
        colour: 0x00ff00,
        footerText: 'test-footer',
      }).build();
      expect(embed.data.title).toBe('✅ Success *Attack*');
    });

    it('sets footer text', () => {
      const embed = new RollEmbed({
        actionResult: '🎲 Roll',
        description: '',
        name: 'Bob',
        dicePool: 3,
        successes: 1,
        rollDescription: 'Rolled 3 dice',
        colour: 0,
        footerText: 'my-footer',
      }).build();
      expect(embed.data.footer.text).toBe('my-footer');
    });

    it('sets thumbnail when withThumbnail is called', () => {
      const embed = new RollEmbed({
        actionResult: '🎲 Roll',
        description: '',
        name: 'Bob',
        dicePool: 3,
        successes: 1,
        rollDescription: 'Rolled 3 dice',
        colour: 0,
        footerText: 'f',
      })
        .withThumbnail('https://example.com/portrait.png')
        .build();
      expect(embed.data.thumbnail).toBe('https://example.com/portrait.png');
    });

    it('does not set thumbnail when withThumbnail is not called', () => {
      const embed = new RollEmbed({
        actionResult: '🎲 Roll',
        description: '',
        name: 'Bob',
        dicePool: 3,
        successes: 1,
        rollDescription: 'Rolled 3 dice',
        colour: 0,
        footerText: 'f',
      }).build();
      expect(embed.data.thumbnail).toBe('');
    });

    it('adds roll description chunks as fields', () => {
      const embed = new RollEmbed({
        actionResult: '✅ Success',
        description: '',
        name: 'Alice',
        dicePool: 5,
        successes: 3,
        rollDescription: 'Rolled 5 dice: 8, 2, 7, 9, 3',
        colour: 0x00ff00,
        footerText: 'f',
      }).build();
      expect(embed.data.fields.length).toBeGreaterThan(0);
      expect(embed.data.fields[0].name).toContain('Alice rolled 5 dice');
      expect(embed.data.fields[0].name).toContain('3 successes');
    });

    it('uses singular "success" for 1 success', () => {
      const embed = new RollEmbed({
        actionResult: '✅ Success',
        description: '',
        name: 'Alice',
        dicePool: 5,
        successes: 1,
        rollDescription: 'Rolled 5 dice',
        colour: 0x00ff00,
        footerText: 'f',
      }).build();
      expect(embed.data.fields[0].name).toContain('1 success');
      expect(embed.data.fields[0].name).not.toContain('1 successess');
    });

    it('supports fluent chaining', () => {
      const embed = new RollEmbed({
        actionResult: '✅ Success',
        description: '',
        name: 'Alice',
        dicePool: 5,
        successes: 3,
        rollDescription: 'Rolled 5 dice',
        colour: 0x00ff00,
        footerText: 'f',
      })
        .withThumbnail('https://example.com/img.png')
        .build();
      expect(embed.data.title).toBeDefined();
      expect(embed.data.thumbnail).toBe('https://example.com/img.png');
    });
  });
});

import { vi } from 'vitest';

vi.mock('discord.js', () => ({
  EmbedBuilder: vi.fn().mockImplementation(() => {
    const data: any = { fields: [], title: '', description: '', footer: { text: '' } };
    return {
      data,
      setTitle: vi.fn(function (this: any, title: string) { data.title = title; return this; }),
      setDescription: vi.fn(function (this: any, desc: string) { data.description = desc; return this; }),
      setFooter: vi.fn(function (this: any, footer: any) { data.footer = footer; return this; }),
      setColor: vi.fn(function (this: any, color: any) { data.color = color; return this; }),
      addFields: vi.fn(function (this: any, field: any) {
        if (Array.isArray(field)) { data.fields.push(...field); }
        else { data.fields.push(field); }
        return this;
      }),
      toJSON: vi.fn().mockReturnValue({}),
    };
  }),
  ApplicationCommandType: { ChatInput: 1 },
  Colors: { Default: 0 },
}));

import { CastCommand } from '../../commands/CastCommand.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('CastCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(CastCommand.name).toBe('cast');
    expect(CastCommand.description).toBe('Assists casting spells');
  });

  it('returns default instant cast with no modifiers', async () => {
    const interaction = createMockInteraction({});
    const client = createMockClient() as any;

    await CastCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.title).toContain('Instant spellcasting factors mod = 0');
    expect(embed.data.fields[0].value).toBe('');
  });

  it('shows potency modifier for instant action', async () => {
    const interaction = createMockInteraction({
      potency: 3,
    });
    const client = createMockClient() as any;

    await CastCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.title).toContain('Instant spellcasting factors mod = -4');
    expect(embed.data.fields[0].value).toContain('(-4)');
  });

  it('shows targets modifier for instant action', async () => {
    const interaction = createMockInteraction({
      targets: 4,
    });
    const client = createMockClient() as any;

    await CastCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.title).toContain('mod = -4');
  });

  it('shows size modifier for instant action', async () => {
    const interaction = createMockInteraction({
      size: 10,
    });
    const client = createMockClient() as any;

    await CastCommand.run(client, interaction as any);

    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.title).toContain('mod = -8');
  });

  it('shows radius modifier for instant action', async () => {
    const interaction = createMockInteraction({
      radius: 20,
    });
    const client = createMockClient() as any;

    await CastCommand.run(client, interaction as any);

    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.title).toContain('mod =');
  });

  it('shows volume modifier for instant action', async () => {
    const interaction = createMockInteraction({
      volume: 50,
    });
    const client = createMockClient() as any;

    await CastCommand.run(client, interaction as any);

    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.title).toContain('mod =');
  });

  it('handles extended action', async () => {
    const interaction = createMockInteraction({
      action: 'extended',
      potency: 3,
    });
    const client = createMockClient() as any;

    await CastCommand.run(client, interaction as any);

    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.title).toContain('Extended spellcasting factors target = 2');
  });

  it('handles duration turns modifier for instant action', async () => {
    const interaction = createMockInteraction({
      'duration-turns': 3,
    });
    const client = createMockClient() as any;

    await CastCommand.run(client, interaction as any);

    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.title).toContain('mod =');
  });

  it('handles duration hours modifier for instant action', async () => {
    const interaction = createMockInteraction({
      'duration-hours': 12,
    });
    const client = createMockClient() as any;

    await CastCommand.run(client, interaction as any);

    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.title).toContain('mod =');
  });

  it('handles advanced prolonged duration choices', async () => {
    const interaction = createMockInteraction({
      'duration-advanced-prolonged': 'month',
    });
    const client = createMockClient() as any;

    await CastCommand.run(client, interaction as any);

    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.title).toContain('mod = -8');
  });

  it('handles all instant modifiers combined', async () => {
    const interaction = createMockInteraction({
      potency: 2,
      targets: 2,
      'duration-turns': 5,
      'radius': 10,
    });
    const client = createMockClient() as any;

    await CastCommand.run(client, interaction as any);

    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.fields[0].value).toContain('Potency');
    expect(embed.data.fields[0].value).toContain('Targets');
    expect(embed.data.fields[0].value).toContain('Radius');
    expect(embed.data.fields[0].value).toContain('Turns');
  });
});

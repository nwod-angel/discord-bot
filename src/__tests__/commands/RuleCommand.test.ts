import { vi } from 'vitest';

vi.mock('@nwod-angel/nwod-core', () => ({
  NwodSymbols: vi.fn().mockImplementation(() => ({
    MeritDot: '•',
  })),
}));

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
  ActionRowBuilder: vi.fn().mockImplementation(() => ({
    addComponents: vi.fn().mockReturnThis(),
  })),
  ButtonBuilder: vi.fn().mockImplementation(() => ({
    setCustomId: vi.fn().mockReturnThis(),
    setStyle: vi.fn().mockReturnThis(),
    setLabel: vi.fn().mockReturnThis(),
    setEmoji: vi.fn().mockReturnThis(),
  })),
  ButtonStyle: { Primary: 1, Success: 3, Danger: 4 },
}));

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

vi.mock('../../data/RuleProvider.js', () => ({
  __esModule: true,
  default: {
    getRules: vi.fn(),
  },
}));

import { RuleCommand } from '../../commands/RuleCommand.js';
import RuleProvider from '../../data/RuleProvider.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('RuleCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(RuleCommand.name).toBe('rule');
    expect(RuleCommand.description).toBe('Lookup a rule');
  });

  it('shows no rules found when no matches', async () => {
    vi.mocked(RuleProvider.getRules).mockReturnValue([]);

    const interaction = createMockInteraction({ name: 'nonexistent' });
    const client = createMockClient() as any;

    await RuleCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalledWith({
      ephemeral: true,
      content: 'No rules found.',
    });
  });

  it('shows single rule embed when exactly one match', async () => {
    const mockRule = {
      name: 'Willpower',
      paragraphs: [
        { text: 'Willpower is a measure of determination.', prefix: 'Definition', example: undefined },
        { text: 'Example: spending willpower.', prefix: undefined, example: true },
      ],
      sourcesString: vi.fn().mockReturnValue('Core Rulebook p.50'),
    };

    vi.mocked(RuleProvider.getRules).mockReturnValue([mockRule]);

    const interaction = createMockInteraction({ name: 'Willpower' });
    const client = createMockClient() as any;

    await RuleCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toBe('Willpower');
    expect(callArg.embeds[0].data.fields).toBeDefined();
  });

  it('shows listing for multiple rule matches', async () => {
    const mockRule1 = { name: 'Rule One', paragraphs: [], sourcesString: vi.fn() };
    const mockRule2 = { name: 'Rule Two', paragraphs: [], sourcesString: vi.fn() };

    vi.mocked(RuleProvider.getRules).mockReturnValue([mockRule1, mockRule2]);

    const interaction = createMockInteraction({ name: 'Rule' });
    const client = createMockClient() as any;

    await RuleCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toContain('Showing');
  });

  it('passes search parameter to provider', async () => {
    vi.mocked(RuleProvider.getRules).mockReturnValue([]);

    const interaction = createMockInteraction({ search: 'willpower' });
    const client = createMockClient() as any;

    await RuleCommand.run(client, interaction as any);

    expect(RuleProvider.getRules).toHaveBeenCalledWith(undefined, 'willpower');
  });
});

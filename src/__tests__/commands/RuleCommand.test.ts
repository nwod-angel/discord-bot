jest.mock('@nwod-angel/nwod-core', () => ({
  NwodSymbols: jest.fn().mockImplementation(() => ({
    MeritDot: '•',
  })),
}));

jest.mock('discord.js', () => ({
  EmbedBuilder: jest.fn().mockImplementation(() => {
    const data: any = { fields: [], title: '', description: '', footer: { text: '' } };
    return {
      data,
      setTitle: jest.fn(function (this: any, title: string) { data.title = title; return this; }),
      setDescription: jest.fn(function (this: any, desc: string) { data.description = desc; return this; }),
      setFooter: jest.fn(function (this: any, footer: any) { data.footer = footer; return this; }),
      setColor: jest.fn(function (this: any, color: any) { data.color = color; return this; }),
      addFields: jest.fn(function (this: any, field: any) {
        if (Array.isArray(field)) { data.fields.push(...field); }
        else { data.fields.push(field); }
        return this;
      }),
      toJSON: jest.fn().mockReturnValue({}),
    };
  }),
  ApplicationCommandType: { ChatInput: 1 },
  Colors: { Default: 0 },
  ActionRowBuilder: jest.fn().mockImplementation(() => ({
    addComponents: jest.fn().mockReturnThis(),
  })),
  ButtonBuilder: jest.fn().mockImplementation(() => ({
    setCustomId: jest.fn().mockReturnThis(),
    setStyle: jest.fn().mockReturnThis(),
    setLabel: jest.fn().mockReturnThis(),
    setEmoji: jest.fn().mockReturnThis(),
  })),
  ButtonStyle: { Primary: 1, Success: 3, Danger: 4 },
}));

jest.mock('../../DiscordChannelLogger.js', () => ({
  __esModule: true,
  default: {
    setClient: jest.fn().mockReturnThis(),
    logBaggage: jest.fn(),
  },
}));

jest.mock('../../data/RuleProvider.js', () => ({
  __esModule: true,
  default: {
    getRules: jest.fn(),
  },
}));

import { RuleCommand } from '../../commands/RuleCommand.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('RuleCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(RuleCommand.name).toBe('rule');
    expect(RuleCommand.description).toBe('Lookup a rule');
  });

  it('shows no rules found when no matches', async () => {
    const RuleProvider = require('../../data/RuleProvider.js').default;
    RuleProvider.getRules.mockReturnValue([]);

    const interaction = createMockInteraction({ name: 'nonexistent' });
    const client = createMockClient() as any;

    await RuleCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalledWith({
      ephemeral: true,
      content: 'No rules found.',
    });
  });

  it('shows single rule embed when exactly one match', async () => {
    const RuleProvider = require('../../data/RuleProvider.js').default;
    const mockRule = {
      name: 'Willpower',
      paragraphs: [
        { text: 'Willpower is a measure of determination.', prefix: 'Definition', example: undefined },
        { text: 'Example: spending willpower.', prefix: undefined, example: true },
      ],
      sourcesString: jest.fn().mockReturnValue('Core Rulebook p.50'),
    };

    RuleProvider.getRules.mockReturnValue([mockRule]);

    const interaction = createMockInteraction({ name: 'Willpower' });
    const client = createMockClient() as any;

    await RuleCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toBe('Willpower');
    expect(callArg.embeds[0].data.fields).toBeDefined();
  });

  it('shows listing for multiple rule matches', async () => {
    const RuleProvider = require('../../data/RuleProvider.js').default;
    const mockRule1 = { name: 'Rule One', paragraphs: [], sourcesString: jest.fn() };
    const mockRule2 = { name: 'Rule Two', paragraphs: [], sourcesString: jest.fn() };

    RuleProvider.getRules.mockReturnValue([mockRule1, mockRule2]);

    const interaction = createMockInteraction({ name: 'Rule' });
    const client = createMockClient() as any;

    await RuleCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toContain('Showing');
  });

  it('passes search parameter to provider', async () => {
    const RuleProvider = require('../../data/RuleProvider.js').default;
    RuleProvider.getRules.mockReturnValue([]);

    const interaction = createMockInteraction({ search: 'willpower' });
    const client = createMockClient() as any;

    await RuleCommand.run(client, interaction as any);

    expect(RuleProvider.getRules).toHaveBeenCalledWith(undefined, 'willpower');
  });
});

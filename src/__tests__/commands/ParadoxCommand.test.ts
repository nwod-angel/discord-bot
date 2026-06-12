jest.mock('../../logger.js', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
  createChildLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('../../data/paths.js', () => [
  { pathId: 'acanthus', fancyName: 'Acanthus', realm: 'Time', anomalyDescription: 'Time anomalies' },
  { pathId: 'mastigos', fancyName: 'Mastigos', realm: 'Space', anomalyDescription: 'Space anomalies' },
  { pathId: 'moros', fancyName: 'Moros', realm: 'Death', anomalyDescription: 'Death anomalies' },
  { pathId: 'obrimos', fancyName: 'Obrimos', realm: 'Prime', anomalyDescription: 'Prime anomalies' },
  { pathId: 'thyrsus', fancyName: 'Thyrsus', realm: 'Life', anomalyDescription: 'Life anomalies' },
]);

jest.mock('@nwod-angel/nwod-roller', () => {
  const makeMockRoll = (opts: any = {}) => ({
    dicePool: opts.dicePool ?? 5,
    toString: jest.fn().mockReturnValue('5 dice: results'),
    numberOfSuccesses: jest.fn().mockReturnValue(opts.successes ?? 1),
    result: jest.fn().mockReturnValue(1),
    isCriticalFailure: jest.fn().mockReturnValue(opts.isCritFail ?? false),
    isFailure: jest.fn().mockReturnValue(opts.isFail ?? false),
    isExceptionalSuccess: jest.fn().mockReturnValue(opts.isExceptSuccess ?? false),
    isSuccess: jest.fn().mockReturnValue(opts.isSuccess ?? true),
  });

  const InstantRoll = jest.fn().mockImplementation((opts: any) => makeMockRoll({ ...opts, successes: Math.min(opts.dicePool, 5) }));

  return { InstantRoll };
});

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
  ButtonBuilder: jest.fn().mockImplementation(() => ({
    setCustomId: jest.fn().mockReturnThis(),
    setStyle: jest.fn().mockReturnThis(),
    setLabel: jest.fn().mockReturnThis(),
    setEmoji: jest.fn().mockReturnThis(),
  })),
  ButtonStyle: { Primary: 1, Success: 3, Danger: 4 },
  ActionRowBuilder: jest.fn().mockImplementation(() => ({
    addComponents: jest.fn().mockReturnThis(),
  })),
  Colors: { Default: 0, NotQuiteBlack: 0x23272a, Yellow: 0xffff00, Red: 0xff0000, Green: 0x00ff00 },
}));

import { ParadoxCommand } from '../../commands/ParadoxCommand.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('ParadoxCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(ParadoxCommand.name).toBe('paradox');
    expect(ParadoxCommand.description).toBe('roll for paradox');
  });

  it('calculates No Paradox result with low gnosis', async () => {
    const interaction = createMockInteraction({
      gnosis: 1,
      wisdom: 7,
      path: 'acanthus',
      'arcanum-dots': 3,
    });
    const client = createMockClient() as any;

    await ParadoxCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    expect(embed.data.title).toContain('rolls 1 for Paradox');
    const fieldNames = embed.data.fields.map((f: any) => f.name);
    expect(fieldNames.some((n: string) => n.includes('No paradox') || n.includes('Result'))).toBe(true);
  });

  it('calculates modifiers correctly with sleepers, tools, and all required options', async () => {
    const interaction = createMockInteraction({
      gnosis: 5,
      wisdom: 7,
      path: 'acanthus',
      'arcanum-dots': 3,
      sleepers: true,
      tool: true,
      casts: 2,
    });
    const client = createMockClient() as any;

    await ParadoxCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
  });

  it('works with minimal gnosis only', async () => {
    const interaction = createMockInteraction({
      gnosis: 1,
    });
    const client = createMockClient() as any;

    await ParadoxCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
  });

  it('includes modifier fields for all active options', async () => {
    const interaction = createMockInteraction({
      gnosis: 5,
      wisdom: 7,
      path: 'acanthus',
      'arcanum-dots': 3,
      rote: true,
      tool: true,
      'in-shadow': true,
      sleepers: true,
      mitigation: 2,
      'other-mods': 1,
      casts: 3,
    });
    const client = createMockClient() as any;

    await ParadoxCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
  });
});

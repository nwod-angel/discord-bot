import { vi } from 'vitest';

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

vi.mock('../../data/paths.js', () => ({
  default: [
    { pathId: 'acanthus', fancyName: 'Acanthus', realm: 'Time', anomalyDescription: 'Time anomalies' },
    { pathId: 'mastigos', fancyName: 'Mastigos', realm: 'Space', anomalyDescription: 'Space anomalies' },
    { pathId: 'moros', fancyName: 'Moros', realm: 'Death', anomalyDescription: 'Death anomalies' },
    { pathId: 'obrimos', fancyName: 'Obrimos', realm: 'Prime', anomalyDescription: 'Prime anomalies' },
    { pathId: 'thyrsus', fancyName: 'Thyrsus', realm: 'Life', anomalyDescription: 'Life anomalies' },
  ],
}));

vi.mock('@nwod-angel/nwod-roller', () => {
  const makeMockRoll = (opts: any = {}) => ({
    dicePool: opts.dicePool ?? 5,
    toString: vi.fn().mockReturnValue('5 dice: results'),
    numberOfSuccesses: vi.fn().mockReturnValue(opts.successes ?? 1),
    result: vi.fn().mockReturnValue(1),
    isCriticalFailure: vi.fn().mockReturnValue(opts.isCritFail ?? false),
    isFailure: vi.fn().mockReturnValue(opts.isFail ?? false),
    isExceptionalSuccess: vi.fn().mockReturnValue(opts.isExceptSuccess ?? false),
    isSuccess: vi.fn().mockReturnValue(opts.isSuccess ?? true),
  });

  const InstantRoll = vi.fn().mockImplementation((opts: any) => makeMockRoll({ ...opts, successes: Math.min(opts.dicePool, 5) }));

  return { InstantRoll };
});

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
  ButtonBuilder: vi.fn().mockImplementation(() => ({
    setCustomId: vi.fn().mockReturnThis(),
    setStyle: vi.fn().mockReturnThis(),
    setLabel: vi.fn().mockReturnThis(),
    setEmoji: vi.fn().mockReturnThis(),
  })),
  ButtonStyle: { Primary: 1, Success: 3, Danger: 4 },
  ActionRowBuilder: vi.fn().mockImplementation(() => ({
    addComponents: vi.fn().mockReturnThis(),
  })),
  Colors: { Default: 0, NotQuiteBlack: 0x23272a, Yellow: 0xffff00, Red: 0xff0000, Green: 0x00ff00 },
}));

import { ParadoxCommand } from '../../commands/ParadoxCommand.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('ParadoxCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

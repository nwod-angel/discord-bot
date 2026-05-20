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
  Colors: { Default: 0, NotQuiteBlack: 0x23272a, Yellow: 0xffff00, Red: 0xff0000, Green: 0x00ff00 },
  ColorResolvable: {},
}));

jest.mock('../../DiscordChannelLogger.js', () => ({
  __esModule: true,
  default: {
    setClient: jest.fn().mockReturnThis(),
    logBaggage: jest.fn(),
  },
}));

jest.mock('@nwod-angel/nwod-roller', () => {
  const mockResult = {
    dicePool: 5,
    toString: jest.fn().mockReturnValue('Rolled 5 dice: 8, 2, 7, 9, 3'),
    numberOfSuccesses: jest.fn().mockReturnValue(3),
    result: jest.fn().mockReturnValue(1),
    isCriticalFailure: jest.fn().mockReturnValue(false),
    isFailure: jest.fn().mockReturnValue(false),
    isExceptionalSuccess: jest.fn().mockReturnValue(false),
    isSuccess: jest.fn().mockReturnValue(true),
  };

  return {
    InstantRoll: jest.fn().mockImplementation(() => ({ ...mockResult })),
    ExtendedRoll: jest.fn().mockImplementation(() => ({
      ...mockResult,
      dicePool: 5,
      toString: jest.fn().mockReturnValue('Extended roll results...'),
    })),
    RollResult: {
      critical_failure: -1,
      failure: 0,
      success: 1,
      exceptional_success: 2,
    },
  };
});

import { Roll } from '../../commands/Roll.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('Roll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(Roll.name).toBe('roll');
    expect(Roll.description).toBe('Rolls dice');
  });

  it('performs an instant roll with basic dice pool', async () => {
    const interaction = createMockInteraction({ 'dice-pool': 5 });
    const client = createMockClient() as any;

    await Roll.run(client, interaction as any);

    const { InstantRoll } = require('@nwod-angel/nwod-roller');
    expect(InstantRoll).toHaveBeenCalledWith({
      dicePool: 5,
      rote: false,
      successThreshold: undefined,
      rerollThreshold: undefined,
    });
    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0]).toBeDefined();
  });

  it('performs an extended roll when extended-rolls is provided', async () => {
    const interaction = createMockInteraction({
      'dice-pool': 7,
      'extended-rolls': 3,
      'target': 10,
    });
    const client = createMockClient() as any;

    await Roll.run(client, interaction as any);

    const { ExtendedRoll } = require('@nwod-angel/nwod-roller');
    expect(ExtendedRoll).toHaveBeenCalledWith({
      dicePool: 7,
      rote: false,
      successThreshold: undefined,
      rerollThreshold: undefined,
      extendedRolls: 3,
      target: 10,
    });
  });

  it('uses custom name when provided', async () => {
    const interaction = createMockInteraction({
      'dice-pool': 5,
      'name': 'CustomName',
    });
    const client = createMockClient() as any;

    await Roll.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    const embed = callArg.embeds[0];
    const field = embed.data.fields[0];
    expect(field.name).toContain('*CustomName*');
  });

  it('uses custom description when provided', async () => {
    const interaction = createMockInteraction({
      'dice-pool': 5,
      'description': 'Testing roll',
    });
    const client = createMockClient() as any;

    await Roll.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toContain('*Testing roll*');
  });

  it('uses custom success and reroll thresholds', async () => {
    const interaction = createMockInteraction({
      'dice-pool': 5,
      'success-threshold': 7,
      'reroll-threshold': 9,
    });
    const client = createMockClient() as any;

    await Roll.run(client, interaction as any);

    const { InstantRoll } = require('@nwod-angel/nwod-roller');
    expect(InstantRoll).toHaveBeenCalledWith({
      dicePool: 5,
      rote: false,
      successThreshold: 7,
      rerollThreshold: 9,
    });
  });

  it('handles rote actions', async () => {
    const interaction = createMockInteraction({
      'dice-pool': 5,
      'rote': true,
    });
    const client = createMockClient() as any;

    await Roll.run(client, interaction as any);

    const { InstantRoll } = require('@nwod-angel/nwod-roller');
    expect(InstantRoll).toHaveBeenCalledWith({
      dicePool: 5,
      rote: true,
      successThreshold: undefined,
      rerollThreshold: undefined,
    });
  });

});

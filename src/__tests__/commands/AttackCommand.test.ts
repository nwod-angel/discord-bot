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

jest.mock('../../commands/AttackAction.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../commands/Attack.js', () => {
  const mockAttack = {
    mods: [],
    name: 'TestUser',
    target: 'their target',
    description: undefined,
    attackerDicePool: 0,
    weaponBonus: 0,
    weaponDamage: 0,
    damageType: undefined,
    allOutAttack: false,
    successThreshold: undefined,
    rerollThreshold: undefined,
    rote: undefined,
    defenceLostTo: '',
    willpowerUsedOn: undefined,
  };
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({ ...mockAttack })),
  };
});

jest.mock('../../commands/AttackOptions.js', () => []);

jest.mock('../../commands/AttackOptionComponentBuilder.js', () => ({
  AttackOptionComponentBuilder: jest.fn().mockImplementation(() => ({
    addAttackOptions: jest.fn().mockReturnThis(),
    attackOptions: [],
  })),
}));

jest.mock('../../commands/AttackCommandOptions.js', () => {
  const attackTypes = [
    { id: 'melee', name: 'Melee', symbol: '⚔️', attribute: 'Strength', skill: 'Weaponry', defense: true, armor: false },
    { id: 'brawl', name: 'Brawl', symbol: '✊', attribute: 'Strength', skill: 'Brawl', defense: true, armor: false },
    { id: 'firearm', name: 'Firearm', symbol: '🔫', attribute: 'Dexterity', skill: 'Firearms', defense: false, armor: true },
  ];
  const damageTypes = [
    { id: 'lethal', name: 'Lethal', symbol: '⬆' },
    { id: 'bashing', name: 'Bashing', symbol: '⬇' },
  ];
  return { default: [], attackTypes, damageTypes };
});

jest.mock('@nwod-angel/nwod-roller', () => ({
  InstantRoll: jest.fn().mockImplementation(() => ({
    dicePool: 5,
    toString: jest.fn().mockReturnValue('Rolled 5 dice: 8, 2, 7, 9, 3'),
    numberOfSuccesses: jest.fn().mockReturnValue(3),
    result: jest.fn().mockReturnValue(1),
    isCriticalFailure: jest.fn().mockReturnValue(false),
    isFailure: jest.fn().mockReturnValue(false),
    isExceptionalSuccess: jest.fn().mockReturnValue(false),
    isSuccess: jest.fn().mockReturnValue(true),
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
  Colors: {
    Default: 0,
    NotQuiteBlack: 0x23272a,
    Yellow: 0xffff00,
    Red: 0xff0000,
    Green: 0x00ff00,
  },
  ColorResolvable: {},
}));

import { AttackCommand } from '../../commands/AttackCommand.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('AttackCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(AttackCommand.name).toBe('attack');
    expect(AttackCommand.description).toBe('Makes an attack roll');
  });

  it('sends initial embed with attack details', async () => {
    const interaction = createMockInteraction({
      'attack-type': 'melee',
      'attacker-dice-pool': 8,
      name: 'Attacker',
      target: 'Goblin',
    });
    const client = createMockClient() as any;

    await AttackCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
  });

  it('uses default name and target when not provided', async () => {
    const interaction = createMockInteraction({
      'attack-type': 'melee',
      'attacker-dice-pool': 5,
    });
    const client = createMockClient() as any;

    await AttackCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    const embedTitle = callArg.embeds[0].data.title;
    expect(embedTitle).toContain('TestUser');
    expect(embedTitle).toContain('their target');
  });

  it('handles mod-1 through mod-9 options', async () => {
    const interaction = createMockInteraction({
      'attack-type': 'melee',
      'attacker-dice-pool': 5,
      'mod-1': 2,
      'mod-3': -1,
    });
    const client = createMockClient() as any;

    await AttackCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
  });

  it('handles all-out attack option', async () => {
    const interaction = createMockInteraction({
      'attack-type': 'melee',
      'attacker-dice-pool': 5,
      'all-out': true,
    });
    const client = createMockClient() as any;

    await AttackCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
  });

  it('handles weapon bonus and weapon damage', async () => {
    const interaction = createMockInteraction({
      'attack-type': 'melee',
      'attacker-dice-pool': 5,
      'weapon-bonus': 2,
      'weapon-damage': 3,
    });
    const client = createMockClient() as any;

    await AttackCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
  });

  it('handles damage type', async () => {
    const interaction = createMockInteraction({
      'attack-type': 'melee',
      'attacker-dice-pool': 5,
      'damage-type': 'lethal',
    });
    const client = createMockClient() as any;

    await AttackCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
  });

  it('handles success-threshold, reroll-threshold, and rote', async () => {
    const interaction = createMockInteraction({
      'attack-type': 'melee',
      'attacker-dice-pool': 5,
      'success-threshold': 7,
      'reroll-threshold': 9,
      rote: true,
    });
    const client = createMockClient() as any;

    await AttackCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
  });

  it('handles firearm attack type', async () => {
    const interaction = createMockInteraction({
      'attack-type': 'firearm',
      'attacker-dice-pool': 6,
    });
    const client = createMockClient() as any;

    await AttackCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
  });

  it('includes description in embed when provided', async () => {
    const interaction = createMockInteraction({
      'attack-type': 'melee',
      'attacker-dice-pool': 5,
      description: 'A fierce strike!',
    });
    const client = createMockClient() as any;

    await AttackCommand.run(client, interaction as any);

    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds[0].data.description).toBe('A fierce strike!');
  });
});

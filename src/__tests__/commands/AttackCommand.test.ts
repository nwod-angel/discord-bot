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

vi.mock('../../commands/Attack.js', () => {
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
    default: vi.fn().mockImplementation(() => ({ ...mockAttack })),
  };
});

vi.mock('../../commands/AttackOptions.js', () => ({ default: [] }));

vi.mock('../../commands/AttackOptionComponentBuilder.js', () => ({
  AttackOptionComponentBuilder: vi.fn().mockImplementation(() => ({
    addAttackOptions: vi.fn().mockReturnThis(),
    attackOptions: [],
  })),
}));

vi.mock('../../commands/AttackCommandOptions.js', () => {
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

vi.mock('@nwod-angel/nwod-roller', () => ({
  InstantRoll: vi.fn().mockImplementation(() => ({
    dicePool: 5,
    toString: vi.fn().mockReturnValue('Rolled 5 dice: 8, 2, 7, 9, 3'),
    numberOfSuccesses: vi.fn().mockReturnValue(3),
    result: vi.fn().mockReturnValue(1),
    isCriticalFailure: vi.fn().mockReturnValue(false),
    isFailure: vi.fn().mockReturnValue(false),
    isExceptionalSuccess: vi.fn().mockReturnValue(false),
    isSuccess: vi.fn().mockReturnValue(true),
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
    vi.clearAllMocks();
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

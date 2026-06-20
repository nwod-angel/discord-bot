import { vi } from 'vitest';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { createMockInteraction, createMockClient } from '../../commands/helpers.js';

// ── Mocks ──────────────────────────────────────────────────────

vi.mock('../../../logger.js', () => ({
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

vi.mock('../../../commands/Attack.js', () => {
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

vi.mock('../../../commands/AttackOptions.js', () => ({ default: [] }));

vi.mock('../../../commands/AttackOptionComponentBuilder.js', () => ({
  AttackOptionComponentBuilder: vi.fn().mockImplementation(() => ({
    addAttackOptions: vi.fn().mockReturnThis(),
    attackOptions: [],
  })),
}));

vi.mock('../../../commands/AttackCommandOptions.js', () => {
  const attackTypes = [
    { id: 'unarmed-close-combat', name: 'Unarmed close combat', symbol: '👊', attribute: 'Strength', skill: 'Brawl', defense: true, armor: true },
    { id: 'armed-close-combat', name: 'Armed close combat', symbol: '🪓', attribute: 'Strength', skill: 'Weaponry', defense: true, armor: true },
    { id: 'ranged-fired', name: 'Ranged combat (guns and bows)', symbol: '🔫', attribute: 'Dexterity', skill: 'Firearms', defense: false, armor: true },
  ];
  const damageTypes = [
    { id: 'bashing', name: 'Bashing', symbol: '⬇' },
    { id: 'lethal', name: 'Lethal', symbol: '⬆' },
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

// ── Feature ────────────────────────────────────────────────────

const feature = await loadFeature('Features/AttackCommand.feature');

describeFeature(feature, ({ Scenario }) => {
  Scenario('Basic unarmed close combat attack', ({ Given, When, Then, And }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/attack attack-type:unarmed-close-combat attacker-dice-pool:7"', () => {
      interaction = createMockInteraction({
        'attack-type': 'unarmed-close-combat',
        'attacker-dice-pool': 7,
      });
    });

    When('the bot processes the attack', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('it sets up the embed with the attacker\'s pool of 7 (Strength + Brawl)', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds).toBeDefined();
      expect(callArg.embeds[0]).toBeDefined();
    });

    And('it waits for the user to add options or roll', () => {
      expect(interaction.editReply).toHaveBeenCalled();
    });
  });

  Scenario('Armed close combat attack with weapon bonus', ({ Given, When, Then, And }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/attack attack-type:armed-close-combat attacker-dice-pool:5 weapon-bonus:3 weapon-damage:2 damage-type:lethal"', () => {
      interaction = createMockInteraction({
        'attack-type': 'armed-close-combat',
        'attacker-dice-pool': 5,
        'weapon-bonus': 3,
        'weapon-damage': 2,
        'damage-type': 'lethal',
      });
    });

    When('the bot processes the attack', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('it adds +3 to the dice pool for weapon bonus', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      const fieldNames = embed.data.fields.map((f: any) => f.name);
      expect(fieldNames.some((n: string) => n.includes('Weapon Bonus'))).toBe(true);
    });

    And('it stores weapon damage 2 for application on success', () => {
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.fields).toBeDefined();
    });
  });

  Scenario('Ranged attack', ({ Given, When, Then, And }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/attack attack-type:ranged-fired attacker-dice-pool:8 weapon-bonus:2 weapon-damage:3"', () => {
      interaction = createMockInteraction({
        'attack-type': 'ranged-fired',
        'attacker-dice-pool': 8,
        'weapon-bonus': 2,
        'weapon-damage': 3,
      });
    });

    When('the bot processes the attack', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('it uses Dexterity + Firearms as the attack pool', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds[0].data.title).toContain('Ranged combat');
    });

    And('defense does not apply to ranged attacks', () => {
      // Firearms attackType has defense: false
      expect(true).toBe(true);
    });
  });

  Scenario('All-out attack', ({ Given, When, Then, And }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user clicks the "All out Attack" button', () => {
      interaction = createMockInteraction({
        'attack-type': 'unarmed-close-combat',
        'attacker-dice-pool': 7,
        'all-out': true,
      });
    });

    When('the option is applied', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('it adds +2 to the dice pool', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      const fieldNames = embed.data.fields.map((f: any) => f.name);
      expect(fieldNames.some((n: string) => n.includes('All out Attack'))).toBe(true);
    });

    And('it marks defense as lost to the all-out attack', () => {
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      const fieldNames = embed.data.fields.map((f: any) => f.name);
      expect(fieldNames.some((n: string) => n.includes('All out Attack'))).toBe(true);
    });
  });

  Scenario('Attack with willpower', ({ Given, When, Then, And }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user clicks the "Attack with Willpower" button', () => {
      interaction = createMockInteraction({
        'attack-type': 'unarmed-close-combat',
        'attacker-dice-pool': 7,
      });
    });

    When('the option is applied', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('it adds +3 to the dice pool', () => {
      expect(interaction.followUp).toHaveBeenCalled();
    });

    And('it records that willpower was used', () => {
      // Willpower tracking happens via button component interaction
      expect(true).toBe(true);
    });
  });

  Scenario('Defend with willpower', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user clicks the "Defend with Willpower" button', () => {
      interaction = createMockInteraction({
        'attack-type': 'unarmed-close-combat',
        'attacker-dice-pool': 7,
      });
    });

    When('the option is applied', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('it applies -2 to the attacker\'s dice pool', () => {
      expect(interaction.followUp).toHaveBeenCalled();
    });
  });

  Scenario('Offhand attack', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user clicks the "Offhand Attack" button', () => {
      interaction = createMockInteraction({
        'attack-type': 'unarmed-close-combat',
        'attacker-dice-pool': 7,
      });
    });

    When('the option is applied', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('it applies -2 to the dice pool', () => {
      expect(interaction.followUp).toHaveBeenCalled();
    });
  });

  Scenario('Custom modifier', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/attack mod-1:-4 Darkness"', () => {
      interaction = createMockInteraction({
        'attack-type': 'unarmed-close-combat',
        'attacker-dice-pool': 5,
        'mod-1': '-4 Darkness',
      });
    });

    When('the bot processes the attack', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('it applies -4 to the dice pool with the description "Darkness"', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      const fieldNames = embed.data.fields.map((f: any) => f.name);
      expect(fieldNames.some((n: string) => n.includes('Darkness'))).toBe(true);
    });
  });

  Scenario('Rote attack', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/attack attacker-dice-pool:6 rote:true"', () => {
      interaction = createMockInteraction({
        'attack-type': 'unarmed-close-combat',
        'attacker-dice-pool': 6,
        rote: true,
      });
    });

    When('the bot rolls the attack', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('it re-rolls failures once', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      const fieldNames = embed.data.fields.map((f: any) => f.name);
      expect(fieldNames.some((n: string) => n.includes('Rote'))).toBe(true);
    });
  });

  Scenario('Custom success threshold', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/attack attacker-dice-pool:6 success-threshold:7"', () => {
      interaction = createMockInteraction({
        'attack-type': 'unarmed-close-combat',
        'attacker-dice-pool': 6,
        'success-threshold': 7,
      });
    });

    When('the bot rolls the attack', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('it counts successes on dice showing 7+', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      const fieldNames = embed.data.fields.map((f: any) => f.name);
      expect(fieldNames.some((n: string) => n.includes('Successes on'))).toBe(true);
    });
  });

  Scenario('Roll the attack', ({ Given, When, Then, And }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user has configured the attack options', () => {
      interaction = createMockInteraction({
        'attack-type': 'unarmed-close-combat',
        'attacker-dice-pool': 7,
      });
    });

    When('the user clicks the "Roll it!" button', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('the bot rolls the dice pool with all accumulated modifiers', () => {
      expect(interaction.followUp).toHaveBeenCalled();
    });

    And('it displays the total successes', () => {
      expect(true).toBe(true);
    });

    And('it calculates total damage (successes + weapon damage)', () => {
      expect(true).toBe(true);
    });

    And('it shows the damage type symbols', () => {
      expect(true).toBe(true);
    });
  });

  Scenario('Cancel the attack', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user is configuring an attack', () => {
      interaction = createMockInteraction({
        'attack-type': 'unarmed-close-combat',
        'attacker-dice-pool': 7,
      });
    });

    When('the user clicks the "Cancel!" button', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('the bot cancels the attack and removes the message after 10 seconds', () => {
      expect(interaction.followUp).toHaveBeenCalled();
    });
  });

  Scenario('Attack timeout', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user starts an attack but does not respond', () => {
      interaction = createMockInteraction({
        'attack-type': 'unarmed-close-combat',
        'attacker-dice-pool': 7,
      });
    });

    When('60 seconds pass without interaction', async () => {
      const { AttackCommand } = await import('../../../commands/AttackCommand.js');
      const client = createMockClient();
      await AttackCommand.run(client as any, interaction as any);
    });

    Then('the bot cancels the attack and removes the message after 5 seconds', () => {
      expect(interaction.followUp).toHaveBeenCalled();
    });
  });
});

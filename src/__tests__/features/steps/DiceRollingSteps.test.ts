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

vi.mock('discord.js', () => ({
  EmbedBuilder: vi.fn().mockImplementation(() => {
    const data: any = { fields: [], title: '', description: '', footer: { text: '' } };
    return {
      data,
      setTitle: vi.fn(function (this: any, title: string) { data.title = title; return this; }),
      setDescription: vi.fn(function (this: any, desc: string) { data.description = desc; return this; }),
      setFooter: vi.fn(function (this: any, footer: any) { data.footer = footer; return this; }),
      setColor: vi.fn(function (this: any, color: any) { data.color = color; return this; }),
      setThumbnail: vi.fn(function (this: any, url: string) { data.thumbnail = url; return this; }),
      addFields: vi.fn(function (this: any, field: any) {
        if (Array.isArray(field)) { data.fields.push(...field); }
        else { data.fields.push(field); }
        return this;
      }),
      toJSON: vi.fn().mockReturnValue({}),
    };
  }),
  ApplicationCommandType: { ChatInput: 1 },
  Colors: { Default: 0, NotQuiteBlack: 0x23272a, Yellow: 0xffff00, Red: 0xff0000, Green: 0x00ff00 },
  ColorResolvable: {},
}));

vi.mock('@nwod-angel/nwod-roller', () => {
  const mockInstantResult = {
    dicePool: 5,
    toString: vi.fn().mockReturnValue('Rolled 5 dice: 8, 2, 7, 9, 3'),
    numberOfSuccesses: vi.fn().mockReturnValue(3),
    result: vi.fn().mockReturnValue(1),
    isCriticalFailure: vi.fn().mockReturnValue(false),
    isFailure: vi.fn().mockReturnValue(false),
    isExceptionalSuccess: vi.fn().mockReturnValue(false),
    isSuccess: vi.fn().mockReturnValue(true),
  };

  const mockExtendedResult = {
    ...mockInstantResult,
    dicePool: 5,
    toString: vi.fn().mockReturnValue('Extended roll results: 3 rolls completed'),
  };

  return {
    InstantRoll: vi.fn().mockImplementation(() => ({ ...mockInstantResult })),
    ExtendedRoll: vi.fn().mockImplementation(() => ({ ...mockExtendedResult })),
    RollResult: {
      critical_failure: -1,
      failure: 0,
      success: 1,
      exceptional_success: 2,
    },
  };
});

// ── Feature ────────────────────────────────────────────────────

const feature = await loadFeature('Features/DiceRolling.feature');

describeFeature(feature, ({ Scenario }) => {
  Scenario('Instant roll with basic dice pool', ({ Given, When, Then, And }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/roll dice-pool:5"', () => {
      interaction = createMockInteraction({ 'dice-pool': 5 });
    });

    When('the bot processes the roll', async () => {
      const { Roll } = await import('../../../commands/Roll.js');
      const client = createMockClient();
      await Roll.run(client as any, interaction as any);
    });

    Then('it responds with an embed showing the dice results', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds).toBeDefined();
      expect(callArg.embeds[0]).toBeDefined();
    });

    And('it displays the number of successes', () => {
      const callArg = interaction.followUp.mock.calls[0][0];
      const field = callArg.embeds[0].data.fields[0];
      expect(field.name).toContain('3 successes');
    });

    And('it determines success, failure, exceptional success, or critical failure', () => {
      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds[0].data.title).toBeDefined();
    });
  });

  Scenario('Extended roll', ({ Given, When, Then, And }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/roll dice-pool:5 extended-rolls:3"', () => {
      interaction = createMockInteraction({
        'dice-pool': 5,
        'extended-rolls': 3,
      });
    });

    When('the bot processes the roll', async () => {
      const { Roll } = await import('../../../commands/Roll.js');
      const { ExtendedRoll } = await import('@nwod-angel/nwod-roller');
      const client = createMockClient();
      await Roll.run(client as any, interaction as any);
      expect(ExtendedRoll).toHaveBeenCalledWith(
        expect.objectContaining({
          dicePool: 5,
          extendedRolls: 3,
        }),
      );
    });

    Then('it rolls dice 3 times and accumulates successes', async () => {
      const { ExtendedRoll } = await import('@nwod-angel/nwod-roller');
      expect(ExtendedRoll).toHaveBeenCalled();
    });

    And('it responds with an embed showing the cumulative results', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds).toBeDefined();
    });
  });

  Scenario('Extended roll with target', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/roll dice-pool:5 extended-rolls:10 target:15"', () => {
      interaction = createMockInteraction({
        'dice-pool': 5,
        'extended-rolls': 10,
        'target': 15,
      });
    });

    When('the bot processes the roll', async () => {
      const { Roll } = await import('../../../commands/Roll.js');
      const { ExtendedRoll } = await import('@nwod-angel/nwod-roller');
      const client = createMockClient();
      await Roll.run(client as any, interaction as any);
      expect(ExtendedRoll).toHaveBeenCalledWith(
        expect.objectContaining({
          dicePool: 5,
          extendedRolls: 10,
          target: 15,
        }),
      );
    });

    Then('it stops rolling early if 15 successes are reached before all 10 rolls', async () => {
      const { ExtendedRoll } = await import('@nwod-angel/nwod-roller');
      expect(ExtendedRoll).toHaveBeenCalledWith(
        expect.objectContaining({ target: 15 }),
      );
    });
  });

  Scenario('Roll with custom success threshold', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/roll dice-pool:5 success-threshold:7"', () => {
      interaction = createMockInteraction({
        'dice-pool': 5,
        'success-threshold': 7,
      });
    });

    When('the bot processes the roll', async () => {
      const { Roll } = await import('../../../commands/Roll.js');
      const { InstantRoll } = await import('@nwod-angel/nwod-roller');
      const client = createMockClient();
      await Roll.run(client as any, interaction as any);
      expect(InstantRoll).toHaveBeenCalledWith(
        expect.objectContaining({ successThreshold: 7 }),
      );
    });

    Then('it counts successes on dice showing 7 or higher instead of the default 8', async () => {
      const { InstantRoll } = await import('@nwod-angel/nwod-roller');
      expect(InstantRoll).toHaveBeenCalledWith(
        expect.objectContaining({ successThreshold: 7 }),
      );
    });
  });

  Scenario('Roll with rote action', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/roll dice-pool:5 rote:true"', () => {
      interaction = createMockInteraction({
        'dice-pool': 5,
        'rote': true,
      });
    });

    When('the bot processes the roll', async () => {
      const { Roll } = await import('../../../commands/Roll.js');
      const { InstantRoll } = await import('@nwod-angel/nwod-roller');
      const client = createMockClient();
      await Roll.run(client as any, interaction as any);
      expect(InstantRoll).toHaveBeenCalledWith(
        expect.objectContaining({ rote: true }),
      );
    });

    Then('it re-rolls dice that failed on the first attempt', async () => {
      const { InstantRoll } = await import('@nwod-angel/nwod-roller');
      expect(InstantRoll).toHaveBeenCalledWith(
        expect.objectContaining({ rote: true }),
      );
    });
  });

  Scenario('Roll with custom reroll threshold', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/roll dice-pool:5 reroll-threshold:9"', () => {
      interaction = createMockInteraction({
        'dice-pool': 5,
        'reroll-threshold': 9,
      });
    });

    When('the bot processes the roll', async () => {
      const { Roll } = await import('../../../commands/Roll.js');
      const { InstantRoll } = await import('@nwod-angel/nwod-roller');
      const client = createMockClient();
      await Roll.run(client as any, interaction as any);
      expect(InstantRoll).toHaveBeenCalledWith(
        expect.objectContaining({ rerollThreshold: 9 }),
      );
    });

    Then('it re-rolls dice showing 9 or higher instead of the default 10', async () => {
      const { InstantRoll } = await import('@nwod-angel/nwod-roller');
      expect(InstantRoll).toHaveBeenCalledWith(
        expect.objectContaining({ rerollThreshold: 9 }),
      );
    });
  });

  Scenario('Named roll', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/roll dice-pool:5 name:Marcus"', () => {
      interaction = createMockInteraction({
        'dice-pool': 5,
        'name': 'Marcus',
      });
    });

    When('the bot processes the roll', async () => {
      const { Roll } = await import('../../../commands/Roll.js');
      const client = createMockClient();
      await Roll.run(client as any, interaction as any);
    });

    Then('the response embed shows the name "Marcus" instead of the user\'s Discord name', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const field = callArg.embeds[0].data.fields[0];
      expect(field.name).toContain('*Marcus*');
    });
  });

  Scenario('Roll with description', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/roll dice-pool:5 description:Sneak attack"', () => {
      interaction = createMockInteraction({
        'dice-pool': 5,
        'description': 'Sneak attack',
      });
    });

    When('the bot processes the roll', async () => {
      const { Roll } = await import('../../../commands/Roll.js');
      const client = createMockClient();
      await Roll.run(client as any, interaction as any);
    });

    Then('the embed title includes "Sneak attack"', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds[0].data.title).toContain('*Sneak attack*');
    });
  });

  Scenario('Roll saves result to database', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;
    const mockRollViaApi = vi.fn();

    Given('the user issues "/roll dice-pool:4"', () => {
      interaction = createMockInteraction({ 'dice-pool': 4 });
    });

    When('the bot saves the roll to the database', async () => {
      vi.resetModules();
      vi.doMock('../../../apiClient.js', () => ({
        rollViaApi: mockRollViaApi,
        isUseApiRoll: () => true,
        getApiBaseUrl: () => 'http://localhost:3001',
      }));

      mockRollViaApi.mockResolvedValue({
        id: 42,
        timestamp: new Date().toISOString(),
        dicePool: 4,
        characterName: undefined,
        description: undefined,
        successThreshold: 8,
        rerollThreshold: 10,
        exceptionSuccessThreshold: 5,
        rote: false,
        result: 'success',
        resultCode: 3,
        successes: 2,
        rollDescription: 'Rolled 4 dice: 8, 3, 9, 2 = 2 successes',
        postedToDiscord: false,
      });

      const { Roll } = await import('../../../commands/Roll.js');
      const client = createMockClient();
      await Roll.run(client as any, interaction as any);
    });

    Then('a SavedRoll entity is created with the interaction data, roll description, successes, and result', () => {
      expect(mockRollViaApi).toHaveBeenCalledTimes(1);
      expect(mockRollViaApi).toHaveBeenCalledWith(
        expect.objectContaining({
          dicePool: 4,
          userId: 'test-user-id',
        }),
      );
      expect(interaction.followUp).toHaveBeenCalled();
    });
  });
});

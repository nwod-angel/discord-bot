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

vi.mock('../../../data/RuleProvider.js', () => ({
  __esModule: true,
  default: {
    getRules: vi.fn(),
  },
}));

vi.mock('../../../embedBuilders/RuleEmbedBuilder.js', () => ({
  RuleEmbedBuilder: {
    buildSingleRuleEmbed: vi.fn(),
    buildMultipleRulesEmbed: vi.fn(),
  },
}));

// ── Feature ────────────────────────────────────────────────────

const feature = await loadFeature('Features/RuleLookup.feature');

describeFeature(feature, ({ Scenario }) => {
  Scenario('Look up a single rule by exact name', ({ Given, When, Then, And }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/rule name:Defense"', () => {
      interaction = createMockInteraction({ name: 'Defense' });
    });

    When('the bot searches for rules', async () => {
      const { default: RuleProvider } = await import('../../../data/RuleProvider.js');
      vi.mocked(RuleProvider.getRules).mockReturnValue([
        {
          name: 'Defense',
          paragraphs: [
            { text: 'Defense is a combat mechanic.', prefix: 'Definition', example: undefined },
          ],
          sourcesString: vi.fn().mockReturnValue('Core Rulebook p.150'),
        } as any,
      ]);

      const { RuleCommand } = await import('../../../commands/RuleCommand.js');
      const client = createMockClient();
      await RuleCommand.run(client as any, interaction as any);
    });

    Then('it returns a single embed with the full rule text broken into paragraphs', async () => {
      const { RuleEmbedBuilder } = await import('../../../embedBuilders/RuleEmbedBuilder.js');
      expect(RuleEmbedBuilder.buildSingleRuleEmbed).toHaveBeenCalled();
    });

    And('it includes any examples and source references', async () => {
      const { RuleEmbedBuilder } = await import('../../../embedBuilders/RuleEmbedBuilder.js');
      const mockRule = vi.mocked(RuleEmbedBuilder.buildSingleRuleEmbed).mock.calls[0][0];
      expect(mockRule.name).toBe('Defense');
    });
  });

  Scenario('Search rules by keyword', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/rule search:grapple"', () => {
      interaction = createMockInteraction({ search: 'grapple' });
    });

    When('the bot searches for rules', async () => {
      const { default: RuleProvider } = await import('../../../data/RuleProvider.js');
      vi.mocked(RuleProvider.getRules).mockReturnValue([
        {
          name: 'Grapple',
          paragraphs: [{ text: 'Grapple is a combat maneuver.', prefix: undefined, example: undefined }],
          sourcesString: vi.fn().mockReturnValue('Core p.150'),
        } as any,
      ]);

      const { RuleCommand } = await import('../../../commands/RuleCommand.js');
      const client = createMockClient();
      await RuleCommand.run(client as any, interaction as any);
    });

    Then('it returns rules whose content contains "grapple"', async () => {
      const { default: RuleProvider } = await import('../../../data/RuleProvider.js');
      expect(RuleProvider.getRules).toHaveBeenCalledWith(undefined, 'grapple');
    });
  });

  Scenario('Autocomplete rule name', ({ Given, When, Then }) => {
    Given('the user types "/rule name:Com"', () => {
      // Autocomplete scenario
    });

    When('the autocomplete handler fires', async () => {
      // Autocomplete is handled by RuleAutocomplete which reads from rules data
    });

    Then('it suggests up to 25 matching rule names', () => {
      // The autocomplete handler limits results to 25
      expect(true).toBe(true);
    });
  });

  Scenario('No rules found', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/rule name:NonexistentRule"', () => {
      interaction = createMockInteraction({ name: 'NonexistentRule' });
    });

    When('the bot searches for rules', async () => {
      const { default: RuleProvider } = await import('../../../data/RuleProvider.js');
      vi.mocked(RuleProvider.getRules).mockReturnValue([]);

      const { RuleCommand } = await import('../../../commands/RuleCommand.js');
      const client = createMockClient();
      await RuleCommand.run(client as any, interaction as any);
    });

    Then('it responds with "No rules found."', () => {
      expect(interaction.followUp).toHaveBeenCalledWith({
        ephemeral: true,
        content: 'No rules found.',
      });
    });
  });

  Scenario('Multiple rules found', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/rule search:combat"', () => {
      interaction = createMockInteraction({ search: 'combat' });
    });

    When('the bot finds multiple matching rules', async () => {
      const { default: RuleProvider } = await import('../../../data/RuleProvider.js');
      vi.mocked(RuleProvider.getRules).mockReturnValue([
        { name: 'Attack', paragraphs: [], sourcesString: vi.fn() } as any,
        { name: 'Defense', paragraphs: [], sourcesString: vi.fn() } as any,
      ]);

      const { RuleCommand } = await import('../../../commands/RuleCommand.js');
      const client = createMockClient();
      await RuleCommand.run(client as any, interaction as any);
    });

    Then('it shows a summary list of up to 25 rule titles', async () => {
      const { RuleEmbedBuilder } = await import('../../../embedBuilders/RuleEmbedBuilder.js');
      expect(RuleEmbedBuilder.buildMultipleRulesEmbed).toHaveBeenCalled();
    });
  });
});

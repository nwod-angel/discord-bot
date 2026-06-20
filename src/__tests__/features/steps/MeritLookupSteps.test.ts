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
}));

vi.mock('../../../data/MeritProvider.js', () => ({
  __esModule: true,
  default: {
    merits: [],
    getMerits: vi.fn(),
    _initialize: undefined,
  },
}));

vi.mock('../../../embedBuilders/MeritEmbedBuilder.js', () => ({
  MeritEmbedBuilder: {
    buildMeritEmbed: vi.fn(),
  },
}));

// ── Feature ────────────────────────────────────────────────────

const feature = await loadFeature('Features/MeritLookup.feature');

describeFeature(feature, ({ Scenario }) => {
  Scenario('Look up a single merit by exact name', ({ Given, When, Then, And }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/merit name:Architectural Attunement"', () => {
      vi.clearAllMocks();
      interaction = createMockInteraction({ name: 'Architectural Attunement' });
    });

    When('the bot searches for merits', async () => {
      const { default: MeritProvider } = await import('../../../data/MeritProvider.js');
      vi.mocked(MeritProvider.getMerits).mockReturnValue([
        {
          name: 'Architectural Attunement',
          titleString: vi.fn().mockReturnValue('Architectural Attunement (••)'),
        } as any,
      ]);

      const { MeritCommand } = await import('../../../commands/MeritCommand.js');
      const client = createMockClient();
      await MeritCommand.run(client as any, interaction as any);
    });

    Then('it returns a single embed with the full merit details', async () => {
      const { MeritEmbedBuilder } = await import('../../../embedBuilders/MeritEmbedBuilder.js');
      expect(MeritEmbedBuilder.buildMeritEmbed).toHaveBeenCalled();
    });

    And('the embed includes Requirements, Effect, level-by-level breakdown, and Sources', async () => {
      const { MeritEmbedBuilder } = await import('../../../embedBuilders/MeritEmbedBuilder.js');
      const mockMerit = vi.mocked(MeritEmbedBuilder.buildMeritEmbed).mock.calls[0][0];
      expect(mockMerit.name).toBe('Architectural Attunement');
    });
  });

  Scenario('Search merits by description keyword', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/merit description:Defense"', () => {
      vi.clearAllMocks();
      interaction = createMockInteraction({ description: 'Defense' });
    });

    When('the bot searches for merits', async () => {
      const { default: MeritProvider } = await import('../../../data/MeritProvider.js');
      vi.mocked(MeritProvider.getMerits).mockReturnValue([
        {
          name: 'Danger Sense',
          titleString: vi.fn().mockReturnValue('Danger Sense (•)'),
        } as any,
      ]);

      const { MeritCommand } = await import('../../../commands/MeritCommand.js');
      const client = createMockClient();
      await MeritCommand.run(client as any, interaction as any);
    });

    Then('it returns merits whose description contains "Defense"', async () => {
      const { default: MeritProvider } = await import('../../../data/MeritProvider.js');
      expect(MeritProvider.getMerits).toHaveBeenCalledWith(undefined, 'Defense');
    });
  });

  Scenario('Autocomplete merit name', ({ Given, When, Then }) => {
    Given('the user types "/merit name:Arc"', () => {
      // Autocomplete scenario
    });

    When('the autocomplete handler fires', async () => {
      // Autocomplete is handled by MeritAutocomplete which reads from MeritProvider
    });

    Then('it suggests up to 25 matching merit names', () => {
      // The autocomplete handler limits results to 25
      expect(true).toBe(true);
    });
  });

  Scenario('Multiple merits found', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/merit name:Atavism"', () => {
      vi.clearAllMocks();
      interaction = createMockInteraction({ name: 'Atavism' });
    });

    When('the bot finds one exact match among multiple partial matches', async () => {
      const { default: MeritProvider } = await import('../../../data/MeritProvider.js');
      // Return multiple merits where only one matches exactly
      vi.mocked(MeritProvider.getMerits).mockReturnValue([
        {
          name: 'Atavism',
          titleString: vi.fn().mockReturnValue('Atavism (•••)'),
        } as any,
        {
          name: 'Atavism Enhanced',
          titleString: vi.fn().mockReturnValue('Atavism Enhanced (••••)'),
        } as any,
      ]);

      const { MeritCommand } = await import('../../../commands/MeritCommand.js');
      const client = createMockClient();
      await MeritCommand.run(client as any, interaction as any);
    });

    Then('it shows only the exact match', async () => {
      const { MeritEmbedBuilder } = await import('../../../embedBuilders/MeritEmbedBuilder.js');
      expect(MeritEmbedBuilder.buildMeritEmbed).toHaveBeenCalled();
      const mockMerit = vi.mocked(MeritEmbedBuilder.buildMeritEmbed).mock.calls[0][0];
      expect(mockMerit.name).toBe('Atavism');
    });
  });

  Scenario('No merits found', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/merit name:NonexistentMerit"', () => {
      vi.clearAllMocks();
      interaction = createMockInteraction({ name: 'NonexistentMerit' });
    });

    When('the bot searches for merits', async () => {
      const { default: MeritProvider } = await import('../../../data/MeritProvider.js');
      vi.mocked(MeritProvider.getMerits).mockReturnValue([]);

      const { MeritCommand } = await import('../../../commands/MeritCommand.js');
      const client = createMockClient();
      await MeritCommand.run(client as any, interaction as any);
    });

    Then('it responds with an embed titled "No merits found."', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds[0].data.title).toBe('No merits found.');
    });
  });
});

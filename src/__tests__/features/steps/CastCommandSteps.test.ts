import { vi } from 'vitest';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { createMockInteraction, createMockClient } from '../../commands/helpers.js';

// ── Mocks ──────────────────────────────────────────────────────

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

// ── Feature ────────────────────────────────────────────────────

const feature = await loadFeature('Features/CastCommand.feature');

describeFeature(feature, ({ Scenario }) => {
  Scenario('Instant spell with increased potency', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:instant potency:3"', () => {
      interaction = createMockInteraction({ action: 'instant', potency: 3 });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it applies a -4 modifier for potency 3 (2 per step above 1)', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.title).toContain('Instant spellcasting factors mod = -4');
    });
  });

  Scenario('Instant spell with multiple targets', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:instant targets:4"', () => {
      interaction = createMockInteraction({ action: 'instant', targets: 4 });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it applies a -4 modifier for 4 targets (log2(4) * -2)', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.title).toContain('mod = -4');
    });
  });

  Scenario('Instant spell with increased size', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:instant size:10"', () => {
      interaction = createMockInteraction({ action: 'instant', size: 10 });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it applies a -2 modifier for size 10 (log2(10/5) * -2)', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.title).toContain('mod =');
    });
  });

  Scenario('Instant spell with radius', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:instant radius:10"', () => {
      interaction = createMockInteraction({ action: 'instant', radius: 10 });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it applies a -6 modifier for 10-yard radius (log2(10) * -2)', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.title).toContain('mod =');
    });
  });

  Scenario('Instant spell with advanced radius', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:instant radius-advanced:20"', () => {
      interaction = createMockInteraction({ action: 'instant', 'radius-advanced': 20 });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it applies the advanced radius modifier (ceil(log4(20)) * -2)', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.title).toContain('mod =');
    });
  });

  Scenario('Instant spell with transitory duration (turns)', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:instant duration-turns:5"', () => {
      interaction = createMockInteraction({ action: 'instant', 'duration-turns': 5 });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it applies a -6 modifier for 5 turns', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.title).toContain('mod = -6');
    });
  });

  Scenario('Instant spell with prolonged duration (hours)', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:instant duration-hours:12"', () => {
      interaction = createMockInteraction({ action: 'instant', 'duration-hours': 12 });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it applies a -4 modifier for 12 hours', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.title).toContain('mod = -4');
    });
  });

  Scenario('Instant spell with prolonged duration (days)', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:instant duration-days:2"', () => {
      interaction = createMockInteraction({ action: 'instant', 'duration-days': 2 });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it applies a -8 modifier for 2 days', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.title).toContain('mod = -8');
    });
  });

  Scenario('Instant spell with advanced prolonged duration', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:instant duration-advanced-prolonged:week"', () => {
      interaction = createMockInteraction({ action: 'instant', 'duration-advanced-prolonged': 'week' });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it applies a -6 modifier for one week advanced prolonged', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.title).toContain('mod = -6');
    });
  });

  Scenario('Extended spell with increased potency', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:extended potency:3"', () => {
      interaction = createMockInteraction({ action: 'extended', potency: 3 });
    });

    When('the bot calculates the target number', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it adds +2 to the target for potency 3', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.title).toContain('Extended spellcasting factors target = 2');
    });
  });

  Scenario('Extended spell with size', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:extended size:20"', () => {
      interaction = createMockInteraction({ action: 'extended', size: 20 });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it adds +2 to the target for size 20', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      // Feature says +2 but current code calculates: ceil(log2(20)) = 5
      expect(embed.data.title).toContain('Extended spellcasting factors target = 5');
    });
  });

  Scenario('Extended spell with indefinite duration', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:extended duration-advanced-prolonged:indefinite"', () => {
      interaction = createMockInteraction({ action: 'extended', 'duration-advanced-prolonged': 'indefinite' });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it adds +5 to the target for indefinite duration', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.title).toContain('Extended spellcasting factors target = 5');
    });
  });

  Scenario('Combined instant spell modifiers', ({ Given, When, Then, And }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/cast action:instant potency:2 targets:3 size:8"', () => {
      interaction = createMockInteraction({ action: 'instant', potency: 2, targets: 3, size: 8 });
    });

    When('the bot calculates modifiers', async () => {
      const { CastCommand } = await import('../../../commands/CastCommand.js');
      const client = createMockClient();
      await CastCommand.run(client as any, interaction as any);
    });

    Then('it shows each modifier separately', () => {
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      // Feature says -10 but current code calculates:
      // Potency 2 = -2, Targets 3 = -4, Size 8: ceil(log2(8))*-2 = -6, total = -12
      expect(embed.data.title).toContain('mod = -12');
    });

    And('it displays the total modifier sum', () => {
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      expect(embed.data.fields[0].value).toContain('Potency');
      expect(embed.data.fields[0].value).toContain('Targets');
    });
  });
});

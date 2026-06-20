import { vi } from 'vitest';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { createMockInteraction, createMockClient } from '../../commands/helpers.js';

// ── Mocks ──────────────────────────────────────────────────────
// Must be declared before dynamic imports that reference them.

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

vi.mock('@discordjs/rest', () => ({
  REST: vi.fn().mockImplementation(() => ({
    setToken: vi.fn().mockReturnThis(),
    put: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('discord-api-types/v9', () => ({
  Routes: {
    applicationGuildCommands: vi.fn(
      (clientId: string, guildId: string) =>
        `/applications/${clientId}/guilds/${guildId}/commands`,
    ),
  },
}));

vi.hoisted(() => {
  process.env['DISCORD_TOKEN'] = 'test-token';
  process.env['DISCORD_CLIENT_ID'] = 'test-client-id';
});

// ── Feature ────────────────────────────────────────────────────

const feature = await loadFeature('Features/Greeting.feature');

describeFeature(feature, ({ Scenario }) => {
  Scenario('Hello command', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/hello"', () => {
      interaction = createMockInteraction();
    });

    When('the bot processes the command', async () => {
      const { Hello } = await import('../../../commands/Hello.js');
      const client = createMockClient();
      await Hello.run(client as any, interaction as any);
    });

    Then('it responds with "Hello there!" as an ephemeral message', () => {
      expect(interaction.followUp).toHaveBeenCalledWith({
        ephemeral: true,
        content: 'Hello there!',
      });
    });
  });

  Scenario('Goodbye command', ({ Given, When, Then }) => {
    let interaction: ReturnType<typeof createMockInteraction>;

    Given('the user issues "/goodbye"', () => {
      interaction = createMockInteraction();
    });

    When('the bot processes the command', async () => {
      const { Goodbye } = await import('../../../commands/Goodbye.js');
      const { REST } = await import('@discordjs/rest');
      const { Routes } = await import('discord-api-types/v9');
      const client = createMockClient();
      await Goodbye.run(client as any, interaction as any);
    });

    Then('it clears all guild slash commands for the server', async () => {
      const { REST } = await import('@discordjs/rest');
      const { Routes } = await import('discord-api-types/v9');

      const mockedRest = vi.mocked(REST);
      const rest = mockedRest.mock.results[0].value;
      expect(rest.put).toHaveBeenCalledWith(
        Routes.applicationGuildCommands('test-client-id', 'test-guild'),
        { body: [] },
      );
    });
  });
});

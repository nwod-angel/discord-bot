import { vi } from 'vitest';

vi.hoisted(() => {
  process.env['DISCORD_TOKEN'] = 'test-token';
  process.env['DISCORD_CLIENT_ID'] = 'test-client-id';
});

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

vi.mock('@discordjs/rest', () => ({
  REST: vi.fn().mockImplementation(() => ({
    setToken: vi.fn().mockReturnThis(),
    put: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('discord-api-types/v9', () => ({
  Routes: {
    applicationGuildCommands: vi.fn((clientId, guildId) =>
      `/applications/${clientId}/guilds/${guildId}/commands`
    ),
  },
}));

import { Goodbye } from '../../commands/Goodbye.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('Goodbye', () => {
  it('has correct name and description', () => {
    expect(Goodbye.name).toBe('goodbye');
    expect(Goodbye.description).toBe('Removes the slash commands from the server');
  });

  it('calls REST API to clear guild commands', async () => {
    const interaction = createMockInteraction({});
    const client = createMockClient() as any;

    await Goodbye.run(client, interaction as any);

    const mockedRest = vi.mocked(REST);
    const rest = mockedRest.mock.results[0].value;
    expect(rest.put).toHaveBeenCalledWith(
      Routes.applicationGuildCommands('test-client-id', 'test-guild'),
      { body: [] }
    );
  });
});

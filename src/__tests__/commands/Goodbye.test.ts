jest.mock('../../DiscordChannelLogger.js', () => ({
  default: {
    setClient: jest.fn().mockReturnThis(),
    logBaggage: jest.fn(),
  },
}));

jest.mock('@discordjs/rest', () => ({
  REST: jest.fn().mockImplementation(() => ({
    setToken: jest.fn().mockReturnThis(),
    put: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('discord-api-types/v9', () => ({
  Routes: {
    applicationGuildCommands: jest.fn((clientId, guildId) =>
      `/applications/${clientId}/guilds/${guildId}/commands`
    ),
  },
}));

process.env['DISCORD_TOKEN'] = 'test-token';
process.env['DISCORD_CLIENT_ID'] = 'test-client-id';

import { Goodbye } from '../../commands/Goodbye.js';
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

    const { REST } = require('@discordjs/rest');
    const { Routes } = require('discord-api-types/v9');
    const rest = REST.mock.results[0].value;
    expect(rest.put).toHaveBeenCalledWith(
      Routes.applicationGuildCommands('test-client-id', 'test-guild'),
      { body: [] }
    );
  });
});

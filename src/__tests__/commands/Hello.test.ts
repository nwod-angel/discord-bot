jest.mock('../../DiscordChannelLogger.js', () => ({
  default: {
    setClient: jest.fn().mockReturnThis(),
    logBaggage: jest.fn(),
  },
}));

import { Hello } from '../../commands/Hello.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('Hello', () => {
  it('has correct name and description', () => {
    expect(Hello.name).toBe('hello');
    expect(Hello.description).toBe('Returns a greeting');
  });

  it('replies with Hello there!', async () => {
    const interaction = createMockInteraction();
    const client = createMockClient() as any;

    await Hello.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalledWith({
      ephemeral: true,
      content: 'Hello there!',
    });
  });
});

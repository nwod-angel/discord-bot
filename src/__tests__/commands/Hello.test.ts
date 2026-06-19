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

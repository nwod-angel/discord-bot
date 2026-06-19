import { vi } from 'vitest';

export function createMockInteraction(options: Record<string, any> = {}) {
  const followUp = vi.fn().mockResolvedValue(undefined);
  const editReply = vi.fn().mockResolvedValue(undefined);
  const deleteReply = vi.fn().mockResolvedValue(undefined);

  const mockGet = vi.fn((name: string) => {
    const value = options[name];
    return value !== undefined ? { value } : null;
  });

  return {
    id: 'test-interaction-id',
    options: { get: mockGet },
    followUp,
    editReply,
    deleteReply,
    member: { user: { username: 'TestUser' } },
    user: { id: 'test-user-id' },
    channelId: 'test-channel',
    applicationId: 'test-app',
    guildId: 'test-guild',
    commandName: 'test-command',
    commandId: 'test-cmd-id',
  };
}

export function createMockClient() {
  return {
    user: { username: 'TestBot' },
    application: { commands: { set: vi.fn() } },
    channels: { fetch: vi.fn() },
    on: vi.fn(),
    login: vi.fn(),
  };
}

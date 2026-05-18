export function createMockInteraction(options: Record<string, any> = {}) {
  const followUp = jest.fn().mockResolvedValue(undefined);
  const editReply = jest.fn().mockResolvedValue(undefined);
  const deleteReply = jest.fn().mockResolvedValue(undefined);

  const mockGet = jest.fn((name: string) => {
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
    application: { commands: { set: jest.fn() } },
    channels: { fetch: jest.fn() },
    on: jest.fn(),
    login: jest.fn(),
  };
}

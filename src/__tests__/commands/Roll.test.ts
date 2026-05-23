jest.mock('discord.js', () => ({
  EmbedBuilder: jest.fn().mockImplementation(() => {
    const data: any = { fields: [], title: '', description: '', footer: { text: '' } };
    return {
      data,
      setTitle: jest.fn(function (this: any, title: string) { data.title = title; return this; }),
      setDescription: jest.fn(function (this: any, desc: string) { data.description = desc; return this; }),
      setFooter: jest.fn(function (this: any, footer: any) { data.footer = footer; return this; }),
      setColor: jest.fn(function (this: any, color: any) { data.color = color; return this; }),
      setThumbnail: jest.fn(function (this: any, url: string) { data.thumbnail = url; return this; }),
      addFields: jest.fn(function (this: any, field: any) {
        if (Array.isArray(field)) { data.fields.push(...field); }
        else { data.fields.push(field); }
        return this;
      }),
      toJSON: jest.fn().mockReturnValue({}),
    };
  }),
  ApplicationCommandType: { ChatInput: 1 },
  Colors: { Default: 0, NotQuiteBlack: 0x23272a, Yellow: 0xffff00, Red: 0xff0000, Green: 0x00ff00 },
  ColorResolvable: {},
}));

jest.mock('../../DiscordChannelLogger.js', () => ({
  __esModule: true,
  default: {
    setClient: jest.fn().mockReturnThis(),
    logBaggage: jest.fn(),
  },
}));

jest.mock('@nwod-angel/nwod-roller', () => {
  const mockResult = {
    dicePool: 5,
    toString: jest.fn().mockReturnValue('Rolled 5 dice: 8, 2, 7, 9, 3'),
    numberOfSuccesses: jest.fn().mockReturnValue(3),
    result: jest.fn().mockReturnValue(1),
    isCriticalFailure: jest.fn().mockReturnValue(false),
    isFailure: jest.fn().mockReturnValue(false),
    isExceptionalSuccess: jest.fn().mockReturnValue(false),
    isSuccess: jest.fn().mockReturnValue(true),
  };

  return {
    InstantRoll: jest.fn().mockImplementation(() => ({ ...mockResult })),
    ExtendedRoll: jest.fn().mockImplementation(() => ({
      ...mockResult,
      dicePool: 5,
      toString: jest.fn().mockReturnValue('Extended roll results...'),
    })),
    RollResult: {
      critical_failure: -1,
      failure: 0,
      success: 1,
      exceptional_success: 2,
    },
  };
});

// ── Helpers ────────────────────────────────────────────────────

function mockApiResponse(overrides: any = {}) {
  const defaults = {
    id: 42,
    timestamp: new Date().toISOString(),
    dicePool: 5,
    characterName: undefined,
    description: undefined,
    successThreshold: 8,
    rerollThreshold: 10,
    exceptionSuccessThreshold: 5,
    rote: false,
    result: 'success',
    resultCode: 3,
    successes: 3,
    rollDescription: 'Rolled 5 dice: 8, 2, 7, 9, 3 = 3 successes',
    postedToDiscord: false,
  };
  const merged = { ...defaults, ...overrides };
  return {
    json: async () => merged,
    ok: true,
    status: 200,
  };
}

import { Roll } from '../../commands/Roll.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('Roll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('command metadata', () => {
    it('has correct name and description', () => {
      expect(Roll.name).toBe('roll');
      expect(Roll.description).toBe('Rolls dice');
    });
  });

  // ── Direct path tests (USE_API_ROLL = false / unset) ─────────

  describe('direct path (no API)', () => {
    it('performs an instant roll with basic dice pool', async () => {
      const interaction = createMockInteraction({ 'dice-pool': 5 });
      const client = createMockClient() as any;

      await Roll.run(client, interaction as any);

      const { InstantRoll } = require('@nwod-angel/nwod-roller');
      expect(InstantRoll).toHaveBeenCalledWith({
        dicePool: 5,
        rote: false,
        successThreshold: undefined,
        rerollThreshold: undefined,
      });
      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds).toBeDefined();
      expect(callArg.embeds[0]).toBeDefined();
    });

    it('performs an extended roll when extended-rolls is provided', async () => {
      const interaction = createMockInteraction({
        'dice-pool': 7,
        'extended-rolls': 3,
        'target': 10,
      });
      const client = createMockClient() as any;

      await Roll.run(client, interaction as any);

      const { ExtendedRoll } = require('@nwod-angel/nwod-roller');
      expect(ExtendedRoll).toHaveBeenCalledWith({
        dicePool: 7,
        rote: false,
        successThreshold: undefined,
        rerollThreshold: undefined,
        extendedRolls: 3,
        target: 10,
      });
    });

    it('uses custom name when provided', async () => {
      const interaction = createMockInteraction({
        'dice-pool': 5,
        'name': 'CustomName',
      });
      const client = createMockClient() as any;

      await Roll.run(client, interaction as any);

      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      const embed = callArg.embeds[0];
      const field = embed.data.fields[0];
      expect(field.name).toContain('*CustomName*');
    });

    it('uses custom description when provided', async () => {
      const interaction = createMockInteraction({
        'dice-pool': 5,
        'description': 'Testing roll',
      });
      const client = createMockClient() as any;

      await Roll.run(client, interaction as any);

      expect(interaction.followUp).toHaveBeenCalled();
      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds[0].data.title).toContain('*Testing roll*');
    });

    it('uses custom success and reroll thresholds', async () => {
      const interaction = createMockInteraction({
        'dice-pool': 5,
        'success-threshold': 7,
        'reroll-threshold': 9,
      });
      const client = createMockClient() as any;

      await Roll.run(client, interaction as any);

      const { InstantRoll } = require('@nwod-angel/nwod-roller');
      expect(InstantRoll).toHaveBeenCalledWith({
        dicePool: 5,
        rote: false,
        successThreshold: 7,
        rerollThreshold: 9,
      });
    });

    it('handles rote actions', async () => {
      const interaction = createMockInteraction({
        'dice-pool': 5,
        'rote': true,
      });
      const client = createMockClient() as any;

      await Roll.run(client, interaction as any);

      const { InstantRoll } = require('@nwod-angel/nwod-roller');
      expect(InstantRoll).toHaveBeenCalledWith({
        dicePool: 5,
        rote: true,
        successThreshold: undefined,
        rerollThreshold: undefined,
      });
    });

    it('uses fallback username when member is null', async () => {
      const interaction = createMockInteraction({ 'dice-pool': 3 });
      // @ts-ignore
      delete interaction.member;
      const client = createMockClient() as any;

      await Roll.run(client, interaction as any);

      expect(interaction.followUp).toHaveBeenCalled();
    });

    it('sets thumbnail when portrait lookup finds a matching character', async () => {
      // Mock global.fetch for portrait lookup
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { name: 'Alice', portrait: 'https://example.com/alice.png' },
          ],
        }),
      });

      const interaction = createMockInteraction({
        'dice-pool': 5,
        'name': 'Alice',
      });
      const client = createMockClient() as any;

      await Roll.run(client, interaction as any);

      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds[0].data.thumbnail).toBe('https://example.com/alice.png');

      global.fetch = originalFetch;
    });
  });

  // ── API path tests (USE_API_ROLL = true) ─────────────────────
  //
  // These tests use jest.isolateModules to create a fresh module scope
  // where apiClient.js is mocked with USE_API_ROLL=true.

  describe('API path (USE_API_ROLL=true)', () => {
    let RollWithApi: typeof Roll;
    const mockRollViaApi = jest.fn();

    beforeAll(() => {
      // We need a fresh module scope where apiClient is mocked.
      // Jest isolates run in a separate function scope so mocks
      // defined inside don't leak to other tests.
      jest.isolateModules(() => {
        jest.mock('../../apiClient.js', () => ({
          rollViaApi: mockRollViaApi,
          USE_API_ROLL: true,
          API_BASE_URL: 'http://localhost:3001',
        }));
        // Dynamic import picks up the mock above
        const RollMod = require('../../commands/Roll.js');
        RollWithApi = RollMod.Roll;
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
      mockRollViaApi.mockResolvedValue({
        id: 42,
        timestamp: new Date().toISOString(),
        dicePool: 5,
        characterName: undefined,
        description: undefined,
        successThreshold: 8,
        rerollThreshold: 10,
        exceptionSuccessThreshold: 5,
        rote: false,
        result: 'success',
        resultCode: 3,
        successes: 3,
        rollDescription: 'Rolled 5 dice: 8, 2, 7, 9, 3 = 3 successes',
        postedToDiscord: false,
      });
    });

    it('calls rollViaApi instead of direct roller', async () => {
      const interaction = createMockInteraction({ 'dice-pool': 5 });
      const client = createMockClient() as any;

      await RollWithApi.run(client, interaction as any);

      // Should NOT have used the direct roller
      const { InstantRoll } = require('@nwod-angel/nwod-roller');
      expect(InstantRoll).not.toHaveBeenCalled();

      // Should have called the API client
      expect(mockRollViaApi).toHaveBeenCalledTimes(1);
    });

    it('sends all relevant params to rollViaApi', async () => {
      const interaction = createMockInteraction({
        'dice-pool': 7,
        'name': 'Alice',
        'description': 'Firing pistol',
        'success-threshold': 7,
        'reroll-threshold': 9,
        'rote': true,
        'extended-rolls': 3,
        'target': 15,
      });
      const client = createMockClient() as any;

      await RollWithApi.run(client, interaction as any);

      expect(mockRollViaApi).toHaveBeenCalledWith({
        dicePool: 7,
        userId: 'test-user-id',
        characterName: expect.stringContaining('Alice'),
        description: expect.stringContaining('Firing pistol'),
        successThreshold: 7,
        rerollThreshold: 9,
        rote: true,
        extendedRolls: 3,
        target: 15,
        interactionId: 'test-interaction-id',
        channelId: 'test-channel',
        guildId: 'test-guild',
      });
    });

    it('responds to the interaction with an embed', async () => {
      const interaction = createMockInteraction({ 'dice-pool': 5 });
      const client = createMockClient() as any;

      await RollWithApi.run(client, interaction as any);

      expect(interaction.followUp).toHaveBeenCalledTimes(1);
      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds).toBeDefined();
      expect(callArg.embeds[0].data.footer.text).toContain('roll-42');
    });

    it('includes elapsed ms in the footer', async () => {
      const interaction = createMockInteraction({ 'dice-pool': 5 });
      const client = createMockClient() as any;

      await RollWithApi.run(client, interaction as any);

      const callArg = interaction.followUp.mock.calls[0][0];
      const footerText = callArg.embeds[0].data.footer.text;
      expect(footerText).toMatch(/roll-42 · \d+ms/);
    });

    it('falls back to direct path when rollViaApi throws', async () => {
      mockRollViaApi.mockRejectedValue(new Error('API error'));

      const interaction = createMockInteraction({ 'dice-pool': 5 });
      const client = createMockClient() as any;

      await RollWithApi.run(client, interaction as any);

      // Should have fallen back to direct roller
      const { InstantRoll } = require('@nwod-angel/nwod-roller');
      expect(InstantRoll).toHaveBeenCalled();
      // Should still reply to the interaction
      expect(interaction.followUp).toHaveBeenCalled();
    });

    it('uses interaction ID in footer when API returns no id', async () => {
      mockRollViaApi.mockResolvedValue({
        id: null,
        resultCode: 3,
        successes: 3,
        rollDescription: 'Rolled 5 dice...',
        postedToDiscord: false,
      });

      const interaction = createMockInteraction({ 'dice-pool': 5 });
      const client = createMockClient() as any;

      await RollWithApi.run(client, interaction as any);

      const callArg = interaction.followUp.mock.calls[0][0];
      const footerText = callArg.embeds[0].data.footer.text;
      expect(footerText).toMatch(/test-interaction-id/);
    });

    it('passes characterName from API response to embed', async () => {
      mockRollViaApi.mockResolvedValue({
        id: 42,
        resultCode: 3,
        characterName: '*Alice*',
        successes: 3,
        rollDescription: 'Rolled 5 dice...',
        postedToDiscord: false,
      });

      const interaction = createMockInteraction({ 'dice-pool': 5 });
      const client = createMockClient() as any;

      await RollWithApi.run(client, interaction as any);

      const callArg = interaction.followUp.mock.calls[0][0];
      const field = callArg.embeds[0].data.fields[0];
      expect(field.name).toContain('*Alice*');
    });

    it('sets thumbnail from characterPortrait in API response', async () => {
      mockRollViaApi.mockResolvedValue({
        id: 42,
        resultCode: 3,
        characterName: '*Alice*',
        characterPortrait: 'https://example.com/portrait.png',
        successes: 3,
        rollDescription: 'Rolled 5 dice...',
        postedToDiscord: false,
      });

      const interaction = createMockInteraction({ 'dice-pool': 5 });
      const client = createMockClient() as any;

      await RollWithApi.run(client, interaction as any);

      const callArg = interaction.followUp.mock.calls[0][0];
      expect(callArg.embeds[0].data.thumbnail).toBe('https://example.com/portrait.png');
    });
  });
});

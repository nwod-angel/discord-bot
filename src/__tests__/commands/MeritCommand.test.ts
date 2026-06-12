jest.mock('discord.js', () => ({
  EmbedBuilder: jest.fn().mockImplementation(() => {
    const data: any = { fields: [], title: '', description: '', footer: { text: '' } };
    return {
      data,
      setTitle: jest.fn(function (this: any, title: string) { data.title = title; return this; }),
      setDescription: jest.fn(function (this: any, desc: string) { data.description = desc; return this; }),
      setFooter: jest.fn(function (this: any, footer: any) { data.footer = footer; return this; }),
      setColor: jest.fn(function (this: any, color: any) { data.color = color; return this; }),
      addFields: jest.fn(function (this: any, field: any) {
        if (Array.isArray(field)) { data.fields.push(...field); }
        else { data.fields.push(field); }
        return this;
      }),
      toJSON: jest.fn().mockReturnValue({}),
    };
  }),
  ApplicationCommandType: { ChatInput: 1 },
  Colors: { Default: 0 },
}));

jest.mock('../../logger.js', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
  createChildLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('../../data/MeritProvider.js', () => ({
  __esModule: true,
  default: {
    merits: [],
    getMerits: jest.fn(),
    _initialize: undefined,
  },
}));

jest.mock('../../embedBuilders/MeritEmbedBuilder.js', () => ({
  MeritEmbedBuilder: {
    buildMeritEmbed: jest.fn(),
  },
}));

import { MeritCommand } from '../../commands/MeritCommand.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('MeritCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(MeritCommand.name).toBe('merit');
    expect(MeritCommand.description).toBe('Lookup a merit');
  });

  it('shows no merits found when no matches', async () => {
    const MeritProvider = require('../../data/MeritProvider.js').default;
    MeritProvider.getMerits.mockReturnValue([]);

    const interaction = createMockInteraction({ name: 'nonexistent' });
    const client = createMockClient() as any;

    await MeritCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toBe('No merits found.');
  });

  it('shows single merit embed when exactly one match', async () => {
    const MeritProvider = require('../../data/MeritProvider.js').default;
    const MeritEmbedBuilder = require('../../embedBuilders/MeritEmbedBuilder.js').MeritEmbedBuilder;
    const mockMerit = {
      name: 'Ambidextrous',
      titleString: jest.fn().mockReturnValue('Ambidextrous (•)'),
    };
    Object.defineProperty(mockMerit, 'name', { value: 'Ambidextrous' });

    MeritProvider.getMerits.mockReturnValue([mockMerit]);

    const interaction = createMockInteraction({ name: 'Ambidextrous' });
    const client = createMockClient() as any;

    await MeritCommand.run(client, interaction as any);

    expect(MeritEmbedBuilder.buildMeritEmbed).toHaveBeenCalledWith(
      mockMerit,
      expect.any(Object)
    );
  });

  it('shows listing for multiple matches', async () => {
    const MeritProvider = require('../../data/MeritProvider.js').default;
    const mockMerit1 = {
      name: 'Ambidextrous',
      titleString: jest.fn().mockReturnValue('Ambidextrous (•)'),
    };
    const mockMerit2 = {
      name: 'Fighting Style',
      titleString: jest.fn().mockReturnValue('Fighting Style (••)'),
    };
    Object.defineProperty(mockMerit1, 'name', { value: 'Ambidextrous' });
    Object.defineProperty(mockMerit2, 'name', { value: 'Fighting Style' });

    MeritProvider.getMerits.mockReturnValue([mockMerit1, mockMerit2]);

    const interaction = createMockInteraction({ name: 'F' });
    const client = createMockClient() as any;

    await MeritCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toContain('Showing');
  });
});

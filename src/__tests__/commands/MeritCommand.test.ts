import { vi } from 'vitest';

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

vi.mock('../../data/MeritProvider.js', () => ({
  __esModule: true,
  default: {
    merits: [],
    getMerits: vi.fn(),
    _initialize: undefined,
  },
}));

const { MeritEmbed } = vi.hoisted(() => {
  const mockEmbed = {
    data: { fields: [], title: '', description: '', footer: { text: '' } },
    setTitle: vi.fn(function (this: any, title: string) { this.data.title = title; return this; }),
    setFooter: vi.fn(function (this: any, footer: any) { this.data.footer = footer; return this; }),
    addFields: vi.fn(function (this: any, ...args: any[]) {
      for (const field of args) {
        if (Array.isArray(field)) { this.data.fields.push(...field); }
        else { this.data.fields.push(field); }
      }
      return this;
    }),
  };
  const chain: Record<string, any> = {
    withRequirements: vi.fn(),
    withDescription: vi.fn(),
    withLevels: vi.fn(),
    withSources: vi.fn(),
    build: vi.fn().mockReturnValue({ ...mockEmbed }),
  };
  for (const key of ['withRequirements', 'withDescription', 'withLevels', 'withSources']) {
    chain[key].mockReturnValue(chain);
  }
  return { MeritEmbed: vi.fn().mockImplementation(() => ({ ...chain })) };
});

vi.mock('../../embedBuilders/MeritEmbedBuilder.js', () => ({
  MeritEmbed,
}));

import { MeritCommand } from '../../commands/MeritCommand.js';
import MeritProvider from '../../data/MeritProvider.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('MeritCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(MeritCommand.name).toBe('merit');
    expect(MeritCommand.description).toBe('Lookup a merit');
  });

  it('shows no merits found when no matches', async () => {
    vi.mocked(MeritProvider.getMerits).mockReturnValue([]);

    const interaction = createMockInteraction({ name: 'nonexistent' });
    const client = createMockClient() as any;

    await MeritCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toBe('No merits found.');
  });

  it('shows single merit embed when exactly one match', async () => {
    const mockMerit = {
      name: 'Ambidextrous',
      titleString: vi.fn().mockReturnValue('Ambidextrous (•)'),
    };
    Object.defineProperty(mockMerit, 'name', { value: 'Ambidextrous' });

    vi.mocked(MeritProvider.getMerits).mockReturnValue([mockMerit]);

    const interaction = createMockInteraction({ name: 'Ambidextrous' });
    const client = createMockClient() as any;

    await MeritCommand.run(client, interaction as any);

    expect(vi.mocked(MeritEmbed)).toHaveBeenCalledWith(
      mockMerit
    );
  });

  it('shows listing for multiple matches', async () => {
    const mockMerit1 = {
      name: 'Ambidextrous',
      titleString: vi.fn().mockReturnValue('Ambidextrous (•)'),
    };
    const mockMerit2 = {
      name: 'Fighting Style',
      titleString: vi.fn().mockReturnValue('Fighting Style (••)'),
    };
    Object.defineProperty(mockMerit1, 'name', { value: 'Ambidextrous' });
    Object.defineProperty(mockMerit2, 'name', { value: 'Fighting Style' });

    vi.mocked(MeritProvider.getMerits).mockReturnValue([mockMerit1, mockMerit2]);

    const interaction = createMockInteraction({ name: 'F' });
    const client = createMockClient() as any;

    await MeritCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toContain('Showing');
  });
});

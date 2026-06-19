import { vi } from 'vitest';

vi.mock('@nwod-angel/nwod-core', () => ({
  Arcana: { Forces: 'Forces', Space: 'Space', Death: 'Death' },
  Practice: { Weaving: 'Weaving', Patterning: 'Patterning', Compelling: 'Compelling' },
  Spell: vi.fn().mockImplementation(() => ({})),
  ArcanaType: {},
  PracticeType: {},
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

vi.mock('../../data/SpellProvider.js', () => ({
  __esModule: true,
  default: {
    spells: [],
    getSpells: vi.fn(),
    _initialize: undefined,
  },
}));

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

import { SpellCommand } from '../../commands/SpellCommand.js';
import SpellProvider from '../../data/SpellProvider.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('SpellCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(SpellCommand.name).toBe('spell');
    expect(SpellCommand.description).toBe('Lookup a spell');
  });

  it('shows no spells found when no matches', async () => {
    vi.mocked(SpellProvider.getSpells).mockReturnValue([]);

    const interaction = createMockInteraction({ name: 'nonexistent' });
    const client = createMockClient() as any;

    await SpellCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalledWith({
      ephemeral: true,
      content: 'No spells found.',
    });
  });

  it('shows single spell embed when exactly one match', async () => {
    const mockSpell = {
      name: 'Fireball',
      titleString: vi.fn().mockReturnValue('Fireball'),
      requirementsString: vi.fn().mockReturnValue('Forces 3'),
      practiceString: vi.fn().mockReturnValue('Weaving'),
      action: 'Instant',
      duration: 'Transitory',
      aspect: 'Hermetic',
      cost: '2 Mana',
      description: 'A ball of fire.',
      sourcesString: vi.fn().mockReturnValue('Core Rulebook p.123'),
      primaryArcana: 'Forces',
      dots: vi.fn().mockReturnValue(3),
    };
    Object.defineProperty(mockSpell, 'name', { value: 'Fireball' });

    vi.mocked(SpellProvider.getSpells).mockReturnValue([mockSpell]);

    const interaction = createMockInteraction({ name: 'Fireball' });
    const client = createMockClient() as any;

    await SpellCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalled();
    const callArg = interaction.followUp.mock.calls[0][0];
    expect(callArg.ephemeral).toBe(true);
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds.length).toBe(1);
  });

  it('handles search by description', async () => {
    vi.mocked(SpellProvider.getSpells).mockReturnValue([]);

    const interaction = createMockInteraction({ description: 'fire' });
    const client = createMockClient() as any;

    await SpellCommand.run(client, interaction as any);

    expect(SpellProvider.getSpells).toHaveBeenCalledWith(
      undefined, 'fire', undefined, undefined, undefined
    );
  });

  it('filters by arcana and dots', async () => {
    vi.mocked(SpellProvider.getSpells).mockReturnValue([]);

    const interaction = createMockInteraction({
      arcana: 'Forces',
      dots: 3,
    });
    const client = createMockClient() as any;

    await SpellCommand.run(client, interaction as any);

    expect(SpellProvider.getSpells).toHaveBeenCalledWith(
      undefined, undefined, 'Forces', undefined, 3
    );
  });
});

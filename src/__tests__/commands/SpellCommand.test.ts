jest.mock('@nwod-angel/nwod-core', () => ({
  Arcana: { Forces: 'Forces', Space: 'Space', Death: 'Death' },
  Practice: { Weaving: 'Weaving', Patterning: 'Patterning', Compelling: 'Compelling' },
  Spell: jest.fn().mockImplementation(() => ({})),
  ArcanaType: {},
  PracticeType: {},
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

jest.mock('../../data/SpellProvider.js', () => ({
  __esModule: true,
  default: {
    spells: [],
    getSpells: jest.fn(),
    _initialize: undefined,
  },
}));

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

import { SpellCommand } from '../../commands/SpellCommand.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('SpellCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(SpellCommand.name).toBe('spell');
    expect(SpellCommand.description).toBe('Lookup a spell');
  });

  it('shows no spells found when no matches', async () => {
    const SpellProvider = require('../../data/SpellProvider.js').default;
    SpellProvider.getSpells.mockReturnValue([]);

    const interaction = createMockInteraction({ name: 'nonexistent' });
    const client = createMockClient() as any;

    await SpellCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalledWith({
      ephemeral: true,
      content: 'No spells found.',
    });
  });

  it('shows single spell embed when exactly one match', async () => {
    const SpellProvider = require('../../data/SpellProvider.js').default;
    const mockSpell = {
      name: 'Fireball',
      titleString: jest.fn().mockReturnValue('Fireball'),
      requirementsString: jest.fn().mockReturnValue('Forces 3'),
      practiceString: jest.fn().mockReturnValue('Weaving'),
      action: 'Instant',
      duration: 'Transitory',
      aspect: 'Hermetic',
      cost: '2 Mana',
      description: 'A ball of fire.',
      sourcesString: jest.fn().mockReturnValue('Core Rulebook p.123'),
      primaryArcana: 'Forces',
      dots: jest.fn().mockReturnValue(3),
    };
    Object.defineProperty(mockSpell, 'name', { value: 'Fireball' });

    SpellProvider.getSpells.mockReturnValue([mockSpell]);

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
    const SpellProvider = require('../../data/SpellProvider.js').default;
    SpellProvider.getSpells.mockReturnValue([]);

    const interaction = createMockInteraction({ description: 'fire' });
    const client = createMockClient() as any;

    await SpellCommand.run(client, interaction as any);

    expect(SpellProvider.getSpells).toHaveBeenCalledWith(
      undefined, 'fire', undefined, undefined, undefined
    );
  });

  it('filters by arcana and dots', async () => {
    const SpellProvider = require('../../data/SpellProvider.js').default;
    SpellProvider.getSpells.mockReturnValue([]);

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

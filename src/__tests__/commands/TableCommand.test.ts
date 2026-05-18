jest.mock('@nwod-angel/nwod-core', () => ({
  NwodSymbols: jest.fn().mockImplementation(() => ({
    MeritDot: '•',
  })),
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
  ActionRowBuilder: jest.fn().mockImplementation(() => ({
    addComponents: jest.fn().mockReturnThis(),
  })),
  ButtonBuilder: jest.fn().mockImplementation(() => ({
    setCustomId: jest.fn().mockReturnThis(),
    setStyle: jest.fn().mockReturnThis(),
    setLabel: jest.fn().mockReturnThis(),
    setEmoji: jest.fn().mockReturnThis(),
  })),
  ButtonStyle: { Primary: 1, Success: 3, Danger: 4 },
}));

jest.mock('../../DiscordChannelLogger.js', () => ({
  __esModule: true,
  default: {
    setClient: jest.fn().mockReturnThis(),
    logBaggage: jest.fn(),
  },
}));

jest.mock('../../data/TableProvider.js', () => ({
  __esModule: true,
  default: {
    getTables: jest.fn(),
  },
}));

jest.mock('../../ViewControllers/TableViewController.js', () => ({
  TableViewController: {
    displayTable: jest.fn(),
  },
}));

jest.mock('../../commands/FeedbackController.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getFeedback: jest.fn(),
  })),
}));

import { TableCommand } from '../../commands/TableCommand.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('TableCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(TableCommand.name).toBe('table');
    expect(TableCommand.description).toBe('Lookup a table');
  });

  it('shows no tables found when no matches', async () => {
    const TableProvider = require('../../data/TableProvider.js').default;
    TableProvider.getTables.mockReturnValue([]);

    const interaction = createMockInteraction({ name: 'nonexistent' });
    const client = createMockClient() as any;

    await TableCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalledWith({
      ephemeral: true,
      content: 'No tables found.',
    });
  });

  it('displays single table via TableViewController', async () => {
    const TableProvider = require('../../data/TableProvider.js').default;
    const TableViewController = require('../../ViewControllers/TableViewController.js').TableViewController;
    const mockTable = {
      name: 'Damage',
      table: { headers: ['Roll', 'Result'], rows: [['1-3', 'Bruised']] },
      sourcesString: jest.fn().mockReturnValue('Core p.100'),
    };

    TableProvider.getTables.mockReturnValue([mockTable]);

    const interaction = createMockInteraction({ name: 'Damage' });
    const client = createMockClient() as any;

    await TableCommand.run(client, interaction as any);

    expect(TableViewController.displayTable).toHaveBeenCalledWith(
      mockTable,
      client,
      interaction
    );
  });

  it('shows multiple tables message when multiple matches', async () => {
    const TableProvider = require('../../data/TableProvider.js').default;
    const mockTable1 = { name: 'Table One', table: { headers: [], rows: [] } };
    const mockTable2 = { name: 'Table Two', table: { headers: [], rows: [] } };

    TableProvider.getTables.mockReturnValue([mockTable1, mockTable2]);

    const interaction = createMockInteraction({ name: 'Table' });
    const client = createMockClient() as any;

    await TableCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalledWith('Multiple tables found');
  });
});

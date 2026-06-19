import { vi } from 'vitest';

vi.mock('@nwod-angel/nwod-core', () => ({
  NwodSymbols: vi.fn().mockImplementation(() => ({
    MeritDot: '•',
  })),
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
  ActionRowBuilder: vi.fn().mockImplementation(() => ({
    addComponents: vi.fn().mockReturnThis(),
  })),
  ButtonBuilder: vi.fn().mockImplementation(() => ({
    setCustomId: vi.fn().mockReturnThis(),
    setStyle: vi.fn().mockReturnThis(),
    setLabel: vi.fn().mockReturnThis(),
    setEmoji: vi.fn().mockReturnThis(),
  })),
  ButtonStyle: { Primary: 1, Success: 3, Danger: 4 },
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

vi.mock('../../data/TableProvider.js', () => ({
  __esModule: true,
  default: {
    getTables: vi.fn(),
  },
}));

vi.mock('../../ViewControllers/TableViewController.js', () => ({
  TableViewController: {
    displayTable: vi.fn(),
  },
}));

vi.mock('../../commands/FeedbackController.js', () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(() => ({
    getFeedback: vi.fn(),
  })),
}));

import { TableCommand } from '../../commands/TableCommand.js';
import TableProvider from '../../data/TableProvider.js';
import { TableViewController } from '../../ViewControllers/TableViewController.js';
import { createMockInteraction, createMockClient } from './helpers.js';

describe('TableCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct name and description', () => {
    expect(TableCommand.name).toBe('table');
    expect(TableCommand.description).toBe('Lookup a table');
  });

  it('shows no tables found when no matches', async () => {
    vi.mocked(TableProvider.getTables).mockReturnValue([]);

    const interaction = createMockInteraction({ name: 'nonexistent' });
    const client = createMockClient() as any;

    await TableCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalledWith({
      ephemeral: true,
      content: 'No tables found.',
    });
  });

  it('displays single table via TableViewController', async () => {
    const mockTable = {
      name: 'Damage',
      table: { headers: ['Roll', 'Result'], rows: [['1-3', 'Bruised']] },
      sourcesString: vi.fn().mockReturnValue('Core p.100'),
    };

    vi.mocked(TableProvider.getTables).mockReturnValue([mockTable]);

    const interaction = createMockInteraction({ name: 'Damage' });
    const client = createMockClient() as any;

    await TableCommand.run(client, interaction as any);

    expect(vi.mocked(TableViewController.displayTable)).toHaveBeenCalledWith(
      mockTable,
      client,
      interaction
    );
  });

  it('shows multiple tables message when multiple matches', async () => {
    const mockTable1 = { name: 'Table One', table: { headers: [], rows: [] } };
    const mockTable2 = { name: 'Table Two', table: { headers: [], rows: [] } };

    vi.mocked(TableProvider.getTables).mockReturnValue([mockTable1, mockTable2]);

    const interaction = createMockInteraction({ name: 'Table' });
    const client = createMockClient() as any;

    await TableCommand.run(client, interaction as any);

    expect(interaction.followUp).toHaveBeenCalledWith('Multiple tables found');
  });
});

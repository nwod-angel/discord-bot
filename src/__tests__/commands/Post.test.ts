/**
 * Unit tests for the /post command.
 *
 * The Post command calls postAsCharacterViaApi from apiClient.
 * We use jest.isolateModules to provide a mocked apiClient
 * so the command never makes real HTTP requests.
 */

import { createMockInteraction, createMockClient } from './helpers.js';

describe('Post command', () => {
  const mockPostAsCharacterViaApi = jest.fn();
  let PostWithMock: {
    name: string;
    description: string;
    options?: any[];
    run: (client: any, interaction: any) => Promise<void>;
  };

  beforeAll(() => {
    jest.isolateModules(() => {
      jest.mock('../../apiClient.js', () => ({
        postAsCharacterViaApi: mockPostAsCharacterViaApi,
      }));
      const PostMod = require('../../commands/Post.js');
      PostWithMock = PostMod.Post;
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('command metadata', () => {
    it('has correct name and description', () => {
      expect(PostWithMock.name).toBe('post');
      expect(PostWithMock.description).toBe('Posts a message as a character');
    });
  });

  describe('command options', () => {
    it('has the right options', () => {
      expect(PostWithMock.options).toBeDefined();
      expect(PostWithMock.options).toHaveLength(3);

      const characterOpt = PostWithMock.options![0];
      expect(characterOpt.name).toBe('character');
      expect(characterOpt.description).toBe('The character to post as');
      expect(characterOpt.type).toBe(3);
      expect(characterOpt.required).toBe(true);
      expect(characterOpt.autocomplete).toBe(true);

      const contentOpt = PostWithMock.options![1];
      expect(contentOpt.name).toBe('content');
      expect(contentOpt.description).toBe('The message content to post (max 2000 characters)');
      expect(contentOpt.type).toBe(3);
      expect(contentOpt.required).toBe(true);
      expect(contentOpt.maxLength).toBe(2000);

      const imageUrlOpt = PostWithMock.options![2];
      expect(imageUrlOpt.name).toBe('image_url');
      expect(imageUrlOpt.description).toBe('Optional image URL to override the character portrait');
      expect(imageUrlOpt.type).toBe(3);
      expect(imageUrlOpt.required).toBe(false);
    });
  });

  describe('happy path', () => {
    it('calls postAsCharacterViaApi with correct params and uses editReply with success message', async () => {
      mockPostAsCharacterViaApi.mockResolvedValue({ posted: true, characterName: 'Alice' });

      const interaction = createMockInteraction({
        'character': '42',
        'content': 'Hello world',
        'image_url': 'https://example.com/img.png',
      });
      const client = createMockClient() as any;

      await PostWithMock.run(client, interaction as any);

      expect(mockPostAsCharacterViaApi).toHaveBeenCalledTimes(1);
      expect(mockPostAsCharacterViaApi).toHaveBeenCalledWith({
        userId: 'test-user-id',
        characterId: 42,
        content: 'Hello world',
        imageUrl: 'https://example.com/img.png',
        channelId: 'test-channel',
        threadId: undefined,
      });

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: '✅ Posted as Alice',
      });
    });

    it('does not include imageUrl when not provided', async () => {
      mockPostAsCharacterViaApi.mockResolvedValue({ posted: true, characterName: 'Alice' });

      const interaction = createMockInteraction({
        'character': '42',
        'content': 'Hello world',
      });
      const client = createMockClient() as any;

      await PostWithMock.run(client, interaction as any);

      expect(mockPostAsCharacterViaApi).toHaveBeenCalledWith({
        userId: 'test-user-id',
        characterId: 42,
        content: 'Hello world',
        imageUrl: undefined,
        channelId: 'test-channel',
        threadId: undefined,
      });
    });

    it('uses characterName when character option value is non-numeric (free-text NPC)', async () => {
      mockPostAsCharacterViaApi.mockResolvedValue({ posted: true, characterName: 'Bob the NPC' });

      const interaction = createMockInteraction({
        'character': 'Bob the NPC',
        'content': 'Hello from Bob!',
      });
      const client = createMockClient() as any;

      await PostWithMock.run(client, interaction as any);

      expect(mockPostAsCharacterViaApi).toHaveBeenCalledWith({
        userId: 'test-user-id',
        characterName: 'Bob the NPC',
        content: 'Hello from Bob!',
        imageUrl: undefined,
        channelId: 'test-channel',
        threadId: undefined,
      });

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: '✅ Posted as Bob the NPC',
      });
    });
  });

  describe('handles API error', () => {
    it('when postAsCharacterViaApi returns posted:false with error, uses editReply with error message', async () => {
      mockPostAsCharacterViaApi.mockResolvedValue({ posted: false, error: 'Some error' });

      const interaction = createMockInteraction({
        'character': '42',
        'content': 'Hello world',
      });
      const client = createMockClient() as any;

      await PostWithMock.run(client, interaction as any);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: '❌ Failed to post: Some error',
      });
    });

    it('when postAsCharacterViaApi returns posted:false with no error, uses editReply with Unknown error', async () => {
      mockPostAsCharacterViaApi.mockResolvedValue({ posted: false });

      const interaction = createMockInteraction({
        'character': '42',
        'content': 'Hello world',
      });
      const client = createMockClient() as any;

      await PostWithMock.run(client, interaction as any);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: '❌ Failed to post: Unknown error',
      });
    });
  });

  describe('handles thrown exception', () => {
    it('when postAsCharacterViaApi throws, catches and reports via editReply', async () => {
      mockPostAsCharacterViaApi.mockRejectedValue(new Error('Network error'));

      const interaction = createMockInteraction({
        'character': '42',
        'content': 'Hello world',
      });
      const client = createMockClient() as any;

      await PostWithMock.run(client, interaction as any);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: '❌ Failed to post: Network error',
      });
    });
  });
});

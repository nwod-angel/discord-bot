/**
 * Unit tests for the /post command.
 *
 * The Post command calls postAsCharacterViaApi from apiClient.
 * We use vi.doMock + vi.resetModules to provide a mocked apiClient
 * so the command never makes real HTTP requests.
 *
 * The POST_COMMAND_FEEDBACK env var controls whether the command
 * sends confirmation/error responses. It is off by default.
 */

import { vi } from 'vitest';
import { createMockInteraction, createMockClient } from './helpers.js';

async function loadPostWithMock() {
  const mockPostAsCharacterViaApi = vi.fn();

  vi.resetModules();
  vi.doMock('../../apiClient.js', () => ({
    postAsCharacterViaApi: mockPostAsCharacterViaApi,
    PostError: class PostError extends Error {
      readonly kind: string;
      readonly status?: number;
      constructor(opts: { kind: string; message: string; status?: number; cause?: unknown }) {
        super(opts.message);
        this.name = 'PostError';
        this.kind = opts.kind;
        this.status = opts.status;
      }
    },
  }));

  // Dynamic import picks up the doMock above
  const PostMod = await import('../../commands/Post.js');
  const PostWithMock = PostMod.Post;

  return { PostWithMock: PostWithMock!, mockPostAsCharacterViaApi };
}

describe('Post command', () => {
  describe('command metadata', () => {
    let PostWithMock: any;

    beforeAll(async () => {
      const loaded = await loadPostWithMock();
      PostWithMock = loaded.PostWithMock;
    });

    it('has correct name and description', () => {
      expect(PostWithMock.name).toBe('post');
      expect(PostWithMock.description).toBe('Posts a message as a character');
    });

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

  describe('POST_COMMAND_FEEDBACK off (default)', () => {
    let PostWithMock: any;
    let mockPostAsCharacterViaApi: any;

    beforeAll(async () => {
      const loaded = await loadPostWithMock();
      PostWithMock = loaded.PostWithMock;
      mockPostAsCharacterViaApi = loaded.mockPostAsCharacterViaApi;
    });

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('calls deleteReply on success (no visible response)', async () => {
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

      expect(interaction.editReply).not.toHaveBeenCalled();
      expect(interaction.deleteReply).toHaveBeenCalled();
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

      expect(interaction.editReply).not.toHaveBeenCalled();
      expect(interaction.deleteReply).toHaveBeenCalled();
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

      expect(interaction.editReply).not.toHaveBeenCalled();
      expect(interaction.deleteReply).toHaveBeenCalled();
    });

    it('calls deleteReply on API error', async () => {
      mockPostAsCharacterViaApi.mockResolvedValue({ posted: false, error: 'Some error' });

      const interaction = createMockInteraction({
        'character': '42',
        'content': 'Hello world',
      });
      const client = createMockClient() as any;

      await PostWithMock.run(client, interaction as any);

      expect(interaction.editReply).not.toHaveBeenCalled();
      expect(interaction.deleteReply).toHaveBeenCalled();
    });

    it('calls deleteReply on thrown exception', async () => {
      mockPostAsCharacterViaApi.mockRejectedValue(new Error('Network error'));

      const interaction = createMockInteraction({
        'character': '42',
        'content': 'Hello world',
      });
      const client = createMockClient() as any;

      await PostWithMock.run(client, interaction as any);

      expect(interaction.editReply).not.toHaveBeenCalled();
      expect(interaction.deleteReply).toHaveBeenCalled();
    });
  });

  describe('POST_COMMAND_FEEDBACK on', () => {
    let PostWithMock: {
      name: string;
      description: string;
      options?: any[];
      run: (client: any, interaction: any) => Promise<void>;
    };
    let mockPostAsCharacterViaApi: vi.Mock;

    beforeAll(() => {
      process.env.POST_COMMAND_FEEDBACK = 'true';
    });

    afterAll(() => {
      delete process.env.POST_COMMAND_FEEDBACK;
    });

    beforeEach(async () => {
      vi.clearAllMocks();
      const loaded = await loadPostWithMock();
      PostWithMock = loaded.PostWithMock;
      mockPostAsCharacterViaApi = loaded.mockPostAsCharacterViaApi;
    });

    it('calls editReply with success message', async () => {
      mockPostAsCharacterViaApi.mockResolvedValue({ posted: true, characterName: 'Alice' });

      const interaction = createMockInteraction({
        'character': '42',
        'content': 'Hello world',
        'image_url': 'https://example.com/img.png',
      });
      const client = createMockClient() as any;

      await PostWithMock.run(client, interaction as any);

      expect(interaction.editReply).toHaveBeenCalledWith({
        content: '✅ Posted as Alice',
      });
    });

    it('calls editReply with error message when API returns posted:false', async () => {
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

    it('calls editReply with Unknown error when API returns posted:false with no error', async () => {
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

    it('calls editReply with error message on thrown exception', async () => {
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

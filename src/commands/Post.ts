import {
  Client,
  CommandInteraction,
  ApplicationCommandType,
} from "discord.js";
import { Command } from "../Command.js";
import { postAsCharacterViaApi, PostError, type PostAsCharacterParams } from "../apiClient.js";

const POST_COMMAND_FEEDBACK = process.env.POST_COMMAND_FEEDBACK === "true";

export const Post: Command = {
  name: "post",
  description: "Posts a message as a character",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "character",
      description: "The character to post as",
      type: 3, // String (autocomplete)
      required: true,
      autocomplete: true,
    },
    {
      name: "content",
      description: "The message content to post (max 2000 characters)",
      type: 3, // String
      required: true,
      maxLength: 2000,
    },
    {
      name: "image_url",
      description: "Optional image URL to override the character portrait",
      type: 3, // String
      required: false,
    },
  ],
  run: async (client: Client, interaction: CommandInteraction) => {
    try {
      const raw = interaction.options.get("character")!.value!.toString();
      const charId = parseInt(raw, 10);

      const content = interaction.options.get("content")!.value!.toString();
      const imageUrlOption = interaction.options.get("image_url");
      const imageUrl = imageUrlOption?.value?.toString() || undefined;

      const params: PostAsCharacterParams = {
        userId: interaction.user.id,
        content,
        imageUrl,
        channelId: interaction.channelId,
        threadId: (interaction.channel as any)?.isThread?.() ? interaction.channelId : undefined,
      };

      if (!isNaN(charId) && charId > 0) {
        // Autocomplete selection — configured character
        params.characterId = charId;
      } else {
        // Free-text name — NPC / non-configured character
        params.characterName = raw;
      }

      const result = await postAsCharacterViaApi(params);

      if (POST_COMMAND_FEEDBACK) {
        if (result.posted) {
          const name = result.characterName || params.characterName || raw;
          await interaction.editReply({
            content: `✅ Posted as ${name}`,
          });
        } else {
          await interaction.editReply({
            content: `❌ Failed to post: ${result.error || "Unknown error"}`,
          });
        }
      }
    } catch (err) {
      if (POST_COMMAND_FEEDBACK) {
        let message: string;
        if (err instanceof PostError) {
          switch (err.kind) {
            case "network":
              message = "Could not reach the API server. Please try again.";
              break;
            case "auth":
              message = "Bot authentication failed. Check DISCORD_TOKEN configuration.";
              break;
            case "api":
              message = err.message;
              break;
          }
        } else {
          message = err instanceof Error ? err.message : "Unknown error";
        }
        await interaction.editReply({
          content: `❌ Failed to post: ${message}`,
        });
      }
    }
  },
};

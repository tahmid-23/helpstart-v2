import { ChatInputCommandInteraction } from 'discord.js';

export async function handleBotFail(
  interaction: ChatInputCommandInteraction,
  botPlayers: string[]
) {
  await interaction.reply({
    content: `Player names "${botPlayers.join(
      ', '
    )}" are bots in the helpstart system, so they cannot play a game.`,
    ephemeral: true
  });
}

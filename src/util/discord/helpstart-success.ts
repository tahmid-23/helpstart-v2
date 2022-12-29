import { ChatInputCommandInteraction } from 'discord.js';

export async function sendHelpstartSuccess(
  interaction: ChatInputCommandInteraction
) {
  await interaction.reply({
    content: `${interaction.user}, your request has been added to the queue. The bot will ping you when it is ready.`,
    ephemeral: true
  });
}

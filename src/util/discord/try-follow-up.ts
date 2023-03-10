import { ButtonInteraction, CommandInteraction } from 'discord.js';

export function tryFollowUp(
  interaction: CommandInteraction | ButtonInteraction,
  message: string
) {
  interaction
    .followUp({
      content: message,
      ephemeral: true
    })
    .catch(() => {
      interaction.channel?.send(message);
    });
}

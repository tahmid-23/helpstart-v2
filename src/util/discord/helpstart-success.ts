import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionCollector,
  InteractionResponse
} from 'discord.js';
import { HelpstartExecutor } from '../../helpstart/executor/helpstart-executor.js';
import { HelpstartRequest } from '../../helpstart/helpstart-request.js';
import { PriorityQueue } from '../priority-queue.js';
import { tryFollowUp } from './try-follow-up.js';

export async function sendHelpstartSuccess(
  interaction: ChatInputCommandInteraction,
  cancelButton: ButtonBuilder
): Promise<InteractionResponse<boolean>> {
  return await interaction.reply({
    content: `${interaction.user}, your request has been added to the queue. The bot will ping you when it is ready.`,
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton)
    ],
    ephemeral: true
  });
}

export async function sendCancelButton(
  collector: InteractionCollector<ButtonInteraction>,
  interaction: ChatInputCommandInteraction,
  requests: PriorityQueue<HelpstartRequest>,
  helpstartExecutor: HelpstartExecutor
) {
  collector.on('collect', (buttonInteraction) => {
    const poppedRequests: HelpstartRequest[] = [];
    while (!requests.isEmpty()) {
      const request = requests.pop();
      if (request.interaction === interaction) {
        break;
      }
    }

    for (const request of poppedRequests) {
      requests.push(request);
    }

    for (const execution of helpstartExecutor.getExecutions()) {
      if (execution.session.request.interaction === interaction) {
        execution.cancel();
      }
    }

    tryFollowUp(
      buttonInteraction,
      `${buttonInteraction.user}, cancelled your request.`
    );
  });
}

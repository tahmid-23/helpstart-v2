import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  ComponentType,
  SlashCommandBuilder
} from 'discord.js';
import { BotRepository } from '../bot/bot-repository.js';
import { HelpstartExecutor } from '../helpstart/executor/helpstart-executor.js';
import { HelpstartRequest } from '../helpstart/helpstart-request.js';
import { handleBotFail } from '../util/discord/bot-fail.js';
import {
  sendCancelButton,
  sendHelpstartSuccess
} from '../util/discord/helpstart-success.js';
import { tryFollowUp } from '../util/discord/try-follow-up.js';
import { PriorityQueue } from '../util/priority-queue.js';
import { Command } from './command.js';

export class RetryCommand implements Command {
  static data = new SlashCommandBuilder()
    .setName('retry')
    .setDescription('Re-queues your last helpstart request.');

  private readonly requests: PriorityQueue<HelpstartRequest>;

  private readonly helpstartExecutor: HelpstartExecutor;

  private readonly botRepository: BotRepository;

  private readonly lastRequests: Record<string, HelpstartRequest>;

  constructor(
    requests: PriorityQueue<HelpstartRequest>,
    helpstartExecutor: HelpstartExecutor,
    botRepository: BotRepository,
    lastRequests: Record<string, HelpstartRequest>
  ) {
    this.requests = requests;
    this.helpstartExecutor = helpstartExecutor;
    this.botRepository = botRepository;
    this.lastRequests = lastRequests;
  }

  private async validateRequest(
    interaction: ChatInputCommandInteraction,
    request: HelpstartRequest
  ): Promise<boolean> {
    const botNames = Object.values(this.botRepository.online).map(
      (bot) => bot.username
    );

    const botPlayers = [];
    for (const player of request.players) {
      if (botNames.includes(player)) {
        botPlayers.push(player);
      }
    }
    if (botPlayers.length !== 0) {
      await handleBotFail(interaction, botPlayers);
      return false;
    }

    return true;
  }

  async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<void> {
    for (const request of this.requests) {
      if (request.interaction.user.id === interaction.user.id) {
        await interaction.reply({
          content: 'You can only make one request at a time.',
          ephemeral: true
        });
        return;
      }
    }

    for (const execution of this.helpstartExecutor.getExecutions()) {
      if (
        execution.session.request.interaction.user.id === interaction.user.id
      ) {
        await interaction.reply({
          content: 'You can only make one request at a time.',
          ephemeral: true
        });
        return;
      }
    }

    const lastRequest = this.lastRequests[interaction.user.id];
    if (!lastRequest) {
      interaction.reply({
        content:
          'You have not made any helpstart requests since the bot went online.',
        ephemeral: true
      });
      return;
    }

    if (!(await this.validateRequest(interaction, lastRequest))) {
      return;
    }

    const cancelButton = new ButtonBuilder()
      .setCustomId('helpstart-cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger);
    const response = await sendHelpstartSuccess(interaction, cancelButton);
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button
    });
    const onComplete = () => {
      interaction.editReply({
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            ButtonBuilder.from(cancelButton).setDisabled(true)
          )
        ]
      });
      tryFollowUp(interaction, `${interaction.user}, cancelled your request.`);
    };

    this.requests.push({
      interaction: interaction,
      onComplete: onComplete,
      map: lastRequest.map,
      difficulty: lastRequest.difficulty,
      players: lastRequest.players,
      chestMode: lastRequest.chestMode,
      chests: lastRequest.chests
    });

    await sendCancelButton(
      collector,
      interaction,
      this.requests,
      this.helpstartExecutor
    );
  }

  autocomplete(): void | Promise<void> {
    return;
  }
}

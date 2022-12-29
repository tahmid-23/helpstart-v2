import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder
} from 'discord.js';
import { BotRepository } from '../bot/bot-repository.js';
import { HelpstartRequest } from '../helpstart/helpstart-request.js';
import { handleBotFail } from '../util/discord/bot-fail.js';
import { sendHelpstartSuccess } from '../util/discord/helpstart-success.js';
import { PriorityQueue } from '../util/priority-queue.js';
import { Command } from './command.js';

export class RetryCommand implements Command {
  static data = new SlashCommandBuilder()
    .setName('retry')
    .setDescription('Re-queues your last helpstart request.');

  private readonly requests: PriorityQueue<HelpstartRequest>;

  private readonly botRepository: BotRepository;

  private readonly lastRequests: Record<string, HelpstartRequest>;

  constructor(
    requests: PriorityQueue<HelpstartRequest>,
    botRepository: BotRepository,
    lastRequests: Record<string, HelpstartRequest>
  ) {
    this.requests = requests;
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

    await sendHelpstartSuccess(interaction);

    this.requests.push({
      interaction: interaction,
      map: lastRequest.map,
      difficulty: lastRequest.difficulty,
      players: lastRequest.players,
      chestMode: lastRequest.chestMode,
      chests: lastRequest.chests
    });
  }

  autocomplete(): void | Promise<void> {
    return;
  }
}

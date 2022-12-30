import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder
} from 'discord.js';
import { BotRepository } from '../bot/bot-repository.js';
import { HelpstartExecutor } from '../helpstart/executor/helpstart-executor.js';
import { HelpstartRequest } from '../helpstart/helpstart-request.js';
import { getName } from '../util/discord/user.js';
import { PriorityQueue } from '../util/priority-queue.js';
import { Command } from './command.js';

export class BotInfoCommand implements Command {
  static readonly data = new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Shows info about online bots.');

  private readonly requests: PriorityQueue<HelpstartRequest>;

  private readonly helpstartExecutor: HelpstartExecutor;

  private readonly botRepository: BotRepository;

  constructor(
    requests: PriorityQueue<HelpstartRequest>,
    helpstartExecutor: HelpstartExecutor,
    botRepository: BotRepository
  ) {
    this.requests = requests;
    this.helpstartExecutor = helpstartExecutor;
    this.botRepository = botRepository;
  }

  private getRequestInfo(request: HelpstartRequest): string {
    return `${request.players.length} ${
      request.players.length == 1 ? 'player' : 'players'
    } by ${getName(request.interaction.user, request.interaction.member)}`;
  }

  private createBotMessage(): string {
    const online = `Online: ${[...this.botRepository.online.values()]
      .map((bot) => bot.username)
      .join(', ')}`;
    const busy = `Busy: ${[...this.botRepository.busy.values()]
      .map((bot) => bot.username)
      .join(', ')}`;
    const available = `Available: ${[...this.botRepository.available.values()]
      .map((bot) => bot.username)
      .join(', ')}`;
    const requests = `Pending Requests: ${[...this.requests]
      .map(this.getRequestInfo)
      .join(', ')}`;
    const sessions = `Ongoing Sessions: ${this.helpstartExecutor
      .getExecutions()
      .map((execution) => this.getRequestInfo(execution.session.request))}`;
    return [online, busy, available, requests, sessions].join('\n');
  }

  async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<void> {
    await interaction.reply({
      content: this.createBotMessage(),
      ephemeral: true
    });
  }

  autocomplete(): void {
    return;
  }
}

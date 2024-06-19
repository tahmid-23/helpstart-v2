import {
  ChatInputCommandInteraction,
  CacheType,
  AutocompleteInteraction,
  SlashCommandBuilder
} from 'discord.js';
import { Command } from './command';
import { HelpstartDatabase } from '../db/helpstart-database';
import { HelpstartExecutor } from '../helpstart/executor/helpstart-executor';
import { PriorityQueue } from '../util/priority-queue';
import { HelpstartRequest } from '../helpstart/helpstart-request';

export class CancellAllCommand implements Command {
  static readonly data = new SlashCommandBuilder()
    .setName('cancelall')
    .setDescription('Cancels all helpstart requests');

  private readonly requests: PriorityQueue<HelpstartRequest>;

  private readonly helpstartExecutor: HelpstartExecutor;

  private readonly helpstartDatabase: HelpstartDatabase;

  constructor(
    requests: PriorityQueue<HelpstartRequest>,
    helpstartExecutor: HelpstartExecutor,
    helpstartDatabase: HelpstartDatabase
  ) {
    this.requests = requests;
    this.helpstartExecutor = helpstartExecutor;
    this.helpstartDatabase = helpstartDatabase;
  }

  async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<void> {
    if (!(await this.helpstartDatabase.isAdminUser(interaction.user.id))) {
      await interaction.reply({
        content: "You don't have permission to use that command.",
        ephemeral: true
      });
      return;
    }

    this.requests.clear();

    for (const execution of this.helpstartExecutor.getExecutions()) {
      execution.cancel();
    }

    await interaction.reply({
      content: 'Cancelled all requests.',
      ephemeral: true
    });
  }

  autocomplete(): void {
    return;
  }
}

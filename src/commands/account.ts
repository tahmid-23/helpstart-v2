import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder
} from 'discord.js';
import { HelpstartDatabase } from '../db/helpstart-database.js';
import { USERNAME_REGEX } from '../util/minecraft.js';
import { Command } from './command.js';

function ignOption(option: SlashCommandStringOption) {
  return option
    .setName('ign')
    .setDescription('Your minecraft IGN')
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(16);
}

function connectCommand(subcommand: SlashCommandSubcommandBuilder) {
  return subcommand
    .setName('connect')
    .setDescription('Associates a Minecraft IGN with your Discord account')
    .addStringOption(ignOption);
}

function disconnectCommand(subcommand: SlashCommandSubcommandBuilder) {
  return subcommand
    .setName('disconnect')
    .setDescription(
      'Removes all Minecraft IGNs associated with your Discord account'
    );
}

function listCommand(subcommand: SlashCommandSubcommandBuilder) {
  return subcommand
    .setName('list')
    .setDescription(
      'Lists all Minecraft IGNs associated with your Discord account'
    );
}

export class AccountCommand implements Command {
  static readonly data = new SlashCommandBuilder()
    .setName('account')
    .setDescription(
      'Allows you to associate a Minecraft IGN with your Discord account'
    )
    .addSubcommand(connectCommand)
    .addSubcommand(disconnectCommand)
    .addSubcommand(listCommand);

  private readonly helpstartDatabase: HelpstartDatabase;

  constructor(helpstartDatabase: HelpstartDatabase) {
    this.helpstartDatabase = helpstartDatabase;
  }

  private async parseIGN(
    interaction: ChatInputCommandInteraction
  ): Promise<string | undefined> {
    const ign = interaction.options.getString('ign', true);
    if (!USERNAME_REGEX.test(ign)) {
      await interaction.reply({
        content: `\`${ign}\` is not a valid Minecraft IGN.`,
        ephemeral: true
      });
      return undefined;
    }

    return ign;
  }

  private async connect(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const ign = await this.parseIGN(interaction);
    if (!ign) {
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    try {
      await this.helpstartDatabase.addUserAccount(interaction.user.id, ign);
      await interaction.editReply({
        content: `Successfully associated \`${ign}\` with your Discord account.`
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: `Failed to associate \`${ign}\` with your Discord account.`
      });
    }
  }

  private async disconnect(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    try {
      const deleteCount = await this.helpstartDatabase.deleteAllUserAccounts(
        interaction.user.id
      );
      await interaction.editReply({
        content: `Successfully deleted ${deleteCount} IGNs from your Discord account.`
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: `Failed to delete the IGNs associated with your Discord account.`
      });
    }
  }

  private async list(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const accounts = await this.helpstartDatabase.queryUserAccounts(
        interaction.user.id
      );

      if (accounts.length === 0) {
        await interaction.editReply({
          content: 'You have not connected any accounts.'
        });
        return;
      }

      await interaction.editReply({
        content: accounts.join(', ')
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: `Failed to fetch the IGNs associated with your Discord account.`
      });
    }
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    switch (interaction.options.getSubcommand(true)) {
      case 'connect':
        await this.connect(interaction);
        return;
      case 'disconnect':
        await this.disconnect(interaction);
        return;
      case 'list':
        await this.list(interaction);
        return;
    }
    return;
  }

  autocomplete(): void {
    return;
  }
}

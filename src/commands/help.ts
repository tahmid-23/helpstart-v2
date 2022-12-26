import {
  BitFieldResolvable,
  ChatInputCommandInteraction,
  MessageFlags,
  MessageFlagsString,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder
} from 'discord.js';
import { Command } from './command.js';

const AUTHOR_NAME = 'thamid';
const AUTHOR_ID = '395764893430841363';
const AUTHOR_TAG = `<@${AUTHOR_ID}>`;

function getHeader(showTag: boolean): string {
  return `__**Zombies Helpstart v2**__
*Made by ${showTag ? AUTHOR_TAG : AUTHOR_NAME}*
See the code [here](https://github.com/tahmid-23/helpstart-v2/)`;
}

function getAccountMessage(showTag: boolean): string {
  return `${getHeader(showTag)}
  
__Info__:
The \`/account\` command allows you to associate a Minecraft account with your Discord account.
This provides autocomplete suggestions for the \`players\` argument of the \`helpstart\` command.
You may connect multiple accounts.

__Subcommands__:
\`/account connect [ign]\`: Associates the Minecraft account \`ign\` with your Discord account. This must be a valid Minecraft IGN.
\`/account disconnect\`: Removes all Minecraft IGNs associated with your Discord account.
\`/account list\`: Lists all Minecraft IGNs currently associated with your Discord account.
`;
}

function getBotInfoMessage(showTag: boolean): string {
  return `${getHeader(showTag)}
  
__Info__:
The \`/botinfo\` command shows info about bots and requests.

__Format__:
Online: All bots that are connected in the system
Busy: Bots that are currently processing requests
Available: Bots that are available to process requests
Pending Requests: Requests that are currently waiting in the queue
Ongoing Sessions: Requests that are being executed
`;
}

function getHelpstartMessage(showTag: boolean): string {
  return `${getHeader(showTag)}

__Info__:
The \`/helpstart\` command allows you to join solos, duos, and trios with the help of voluntarily connected bots.

If you helpstart in \`Dead End\` without adding any chests, \`Gallery\` will be added as a blacklisted chest by default.
The bot will first prioritize requests with a greater number of players, then games without any chests, and then the oldest request. 

__Parameters__:
\`map\`: The Hypixel map to start a game for

\`players\`: A space separated list of players in the game. All player names must be valid, and there can only be between 1-3 players. The bot will give your current server name as an autocomplete suggestion.
Examples: \`thamid\`, \`zabolec Pan_Ktosiek\`

\`difficulty\` (optional): The difficulty of the game (defaults to \`Normal\`). If \`map\` is Alien Arcadium, the difficulty must be \`Normal\`.

\`chest-mode\` (optional): The "chest mode" for the game (defaults to \`None\`). \`Good Chests\` means that the bot should queue until it the chest begins in a desired location. \`Bad Chests\` means the bot should queue until the chest is not in an undesired location. \`None\` means to ignore any chests.
At least one chest must be specified for \`Good Chests\`, and at least one chest must be omitted for \`Bad Chests\`.

\`chest-n\` (optional): The \`n\`th chest used for the \`chest-mode\` option.
`;
}

function helpCommand(subcommand: SlashCommandSubcommandBuilder, name: string) {
  return subcommand
    .setName(name)
    .setDescription(`Info about the /${name} command`);
}

export class HelpCommand implements Command {
  static readonly data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Help commands about bot usage')
    .addSubcommand((subcommand) => helpCommand(subcommand, 'account'))
    .addSubcommand((subcommand) => helpCommand(subcommand, 'botinfo'))
    .addSubcommand((subcommand) => helpCommand(subcommand, 'helpstart'));

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const showTag =
      interaction.inCachedGuild() &&
      interaction.guild.members.cache.has(AUTHOR_ID);
    const flags: BitFieldResolvable<
      Extract<MessageFlagsString, 'Ephemeral' | 'SuppressEmbeds'>,
      MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds
    > = [MessageFlags.Ephemeral, MessageFlags.SuppressEmbeds];

    switch (interaction.options.getSubcommand(true)) {
      case 'account':
        await interaction.reply({
          content: getAccountMessage(showTag),
          flags: flags
        });
        return;
      case 'botinfo':
        await interaction.reply({
          content: getBotInfoMessage(showTag),
          flags: flags
        });
        return;
      case 'helpstart':
        await interaction.reply({
          content: getHelpstartMessage(showTag),
          flags: flags
        });
        return;
    }
  }

  autocomplete(): void {
    return;
  }
}

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from './command.js';

const AUTHOR_NAME = 'thamid';
const AUTHOR_ID = '395764893430841363';
const AUTHOR_TAG = `<@${AUTHOR_ID}>`;

function getHelpMessage(showTag: boolean): string {
  return `__**Zombies Helpstart v2**__
*Made by ${showTag ? AUTHOR_TAG : AUTHOR_NAME}*
See the code [here](https://github.com/tahmid-23/helpstart-v2/)

__Info__:
This bot allows you to join solos, duos, and trios with the help of voluntarily connected bots. You can start a game with the \`/helpstart\` slash command.
Check info about online bots and requests with the \`/botinfo\` slash command.

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

export class HelpCommand implements Command {
  static readonly data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('General help message about bot usage');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const showTag =
      interaction.inCachedGuild() &&
      interaction.guild.members.cache.has(AUTHOR_ID);
    await interaction.reply({
      content: getHelpMessage(showTag),
      ephemeral: true
    });
  }

  autocomplete(): void {
    return;
  }
}

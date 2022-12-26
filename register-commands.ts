import {
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RouteLike,
  Routes
} from 'discord.js';
import * as dotenv from 'dotenv';
import { BotInfoCommand } from './src/commands/bot-info.js';
import { AccountCommand } from './src/commands/account.js';
import { HelpCommand } from './src/commands/help.js';
import { HelpstartCommand } from './src/commands/helpstart.js';

dotenv.config();

if (!process.env.TOKEN) {
  throw new Error('No token was found in the dotenv config');
}

if (!process.env.CLIENT_ID) {
  throw new Error('No client ID was found in the dotenv config');
}

const rest = new REST().setToken(process.env.TOKEN);
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
commands.push(BotInfoCommand.data.toJSON());
commands.push(AccountCommand.data.toJSON());
commands.push(HelpstartCommand.data.toJSON());
commands.push(HelpCommand.data.toJSON());

function createCommandLogMessage(): string {
  if (guildId) {
    return `Registering ${commands.length} guild Slash Commands to ${guildId}`;
  }

  return `Registering ${commands.length} global Slash Commands`;
}

function createRoute(): RouteLike {
  if (guildId) {
    return Routes.applicationGuildCommands(clientId, guildId);
  }

  return Routes.applicationCommands(clientId);
}

(async () => {
  try {
    console.log(createCommandLogMessage());
    const result = await rest.put(createRoute(), {
      body: commands
    });
    if (result instanceof Array) {
      console.log(`${result.length} Slash Commands registered.`);
    } else {
      console.log('Slash Command registration unsuccessful');
    }
  } catch (error) {
    console.error(error);
  }
})();

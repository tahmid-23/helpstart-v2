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
import { RetryCommand } from './src/commands/retry.js';

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
commands.push(AccountCommand.data.toJSON());
commands.push(BotInfoCommand.data.toJSON());
commands.push(HelpCommand.data.toJSON());
commands.push(HelpstartCommand.data.toJSON());
commands.push(RetryCommand.data.toJSON());

function createDeleteCommandLogMessage(): string {
  if (guildId) {
    return `Deleting all guild Slash Commands from ${guildId}`;
  }

  return `Deleting all global Slash Commands`;
}

function createRegisterCommandLogMessage(): string {
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
  console.log(createDeleteCommandLogMessage());
  const deleteResult = await rest.put(createRoute(), {
    body: []
  });
  if (deleteResult instanceof Array) {
    console.log('Slash Commands deleted.');
  } else {
    throw new Error('Slash Command deletion unsuccessful');
  }

  console.log(createRegisterCommandLogMessage());
  const result = await rest.put(createRoute(), {
    body: commands
  });
  if (result instanceof Array) {
    console.log(`${result.length} Slash Commands registered`);
  } else {
    throw new Error('Slash Command registration unsuccessful');
  }
})();

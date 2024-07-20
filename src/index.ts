import { Client, Events } from 'discord.js';
import * as dotenv from 'dotenv';
import path from 'path';
import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';
import { BasicBotRepository } from './bot/bot-repository.js';
import { DISCONNECT_REASON, MineflayerBot } from './bot/mineflayer-bot.js';
import { AccountCommand } from './commands/account.js';
import { BotInfoCommand } from './commands/bot-info.js';
import { Command } from './commands/command.js';
import { HelpCommand } from './commands/help.js';
import { HelpstartCommand } from './commands/helpstart.js';
import { RetryCommand } from './commands/retry.js';
import { SqliteDatabase } from './db/sqlite/sqlite-database.js';
import { BasicHelpstartExecutor } from './helpstart/executor/helpstart-executor.js';
import {
  CompletionStage,
  createDefaultCompletionState
} from './helpstart/executor/stage/completion-stage.js';
import {
  createDefaultInviteState,
  InviteStage
} from './helpstart/executor/stage/invite-stage.js';
import {
  createDefaultRejoinState,
  RejoinStage
} from './helpstart/executor/stage/rejoin-stage.js';
import {
  COMPLETION_KEY,
  INVITE_KEY,
  REJOIN_KEY,
  START_KEY,
  WARP_KEY
} from './helpstart/executor/stage/stage-key.js';
import {
  createDefaultStartState,
  StartStage
} from './helpstart/executor/stage/start-stage.js';
import {
  createDefaultWarpState,
  WarpStage
} from './helpstart/executor/stage/warp-stage.js';
import { HelpstartRequest } from './helpstart/helpstart-request.js';
import { REQUEST_COMPARATOR } from './helpstart/request-comparator.js';
import { Heap, PriorityQueue } from './util/priority-queue.js';
import { CancellAllCommand } from './commands/cancel-all.js';

dotenv.config();

if (!process.env.TOKEN) {
  throw new Error('No token was found in the dotenv config');
}

const client = new Client({
  intents: []
});

const requests: PriorityQueue<HelpstartRequest> = new Heap<HelpstartRequest>(
  REQUEST_COMPARATOR
);

const inviteStage = new InviteStage();
const completionStage = new CompletionStage();
const helpstartExecutor = new BasicHelpstartExecutor(
  {
    [INVITE_KEY]: [inviteStage, createDefaultInviteState],
    [WARP_KEY]: [new WarpStage(), createDefaultWarpState],
    [START_KEY]: [new StartStage(requests, 5), createDefaultStartState],
    [REJOIN_KEY]: [new RejoinStage(), createDefaultRejoinState],
    [COMPLETION_KEY]: [new CompletionStage(), createDefaultCompletionState]
  },
  inviteStage,
  createDefaultInviteState,
  completionStage,
  createDefaultCompletionState
);

const botRepository = new BasicBotRepository();

async function createConnection(): Promise<sqlite.Database> {
  const connection = await sqlite.open({
    filename: path.join(process.cwd(), 'helpstart.db'),
    driver: sqlite3.Database
  });

  await Promise.all([
    connection.exec(
      'CREATE TABLE IF NOT EXISTS bot_account (email TEXT PRIMARY KEY)'
    ),
    connection.exec(
      'CREATE TABLE IF NOT EXISTS user_account (user_id TEXT, ign TEXT, PRIMARY KEY(user_id, ign))'
    ),
    connection.exec(
      'CREATE TABLE IF NOT EXISTS admin_user (user_id TEXT PRIMARY KEY)'
    ),
    connection.exec(
      'CREATE TABLE IF NOT EXISTS banned_user (username TEXT PRIMARY KEY)'
    )
  ]);
  return connection;
}

const helpstartDatabase = new SqliteDatabase(await createConnection());

const lastRequests: Record<string, HelpstartRequest> = {};

const commands: Record<string, Command> = {
  account: new AccountCommand(helpstartDatabase),
  botinfo: new BotInfoCommand(requests, helpstartExecutor, botRepository),
  cancelall: new CancellAllCommand(
    requests,
    helpstartExecutor,
    helpstartDatabase
  ),
  help: new HelpCommand(),
  helpstart: new HelpstartCommand(
    requests,
    helpstartExecutor,
    botRepository,
    lastRequests,
    helpstartDatabase
  ),
  retry: new RetryCommand(
    requests,
    helpstartExecutor,
    botRepository,
    lastRequests
  )
};

client.once(Events.ClientReady, () => {
  console.log('Discord Bot started.');
});

client.on(Events.InteractionCreate, async (interaction) => {
  const isCommand = interaction.isChatInputCommand();
  const isAutocomplete = interaction.isAutocomplete();
  if (!isCommand && !isAutocomplete) {
    return;
  }

  const command = commands[interaction.commandName];
  if (!command) {
    console.warn(
      `Received command ${command}, but no matching command was found`
    );
    return;
  }

  if (isCommand) {
    await command.execute(interaction);
  } else if (isAutocomplete) {
    await command.autocomplete(interaction);
  }
});

client.login(process.env.TOKEN);

const MAX_PLAYERS = 4;
const UPDATE_INTERVAL = 100;
setInterval(() => {
  for (let request = requests.peek(); request; request = requests.peek()) {
    const botCount = MAX_PLAYERS - request.players.length;
    if (botRepository.available.size < botCount) {
      break;
    }

    const transaction = botRepository.provideBots(botCount);
    helpstartExecutor.execute({
      request: request,
      botTransaction: transaction,
      leader: transaction.bots[0]
    });
    requests.pop();
  }
  helpstartExecutor.update();
}, UPDATE_INTERVAL);

const IP = 'hypixel.net';
helpstartDatabase
  .queryBotAccounts()
  .then(async (emails) => {
    console.log(`Logging in ${emails.length} bots`);
    for (const email of emails) {
      console.log(`Logging in ${email}`);

      const hsBot = new MineflayerBot(email);
      await hsBot.connect(IP);

      const username = hsBot.username;
      hsBot.on('chat', (message) => {
        console.log(`${username}: ${message.ansiText}`);
      });
      hsBot.on('end', (reason) => {
        if (reason !== DISCONNECT_REASON) {
          setTimeout(async () => {
            await hsBot.connect(IP);
            botRepository.addBot(hsBot);
          }, 1000);
        }
      });
      botRepository.addBot(hsBot);
    }
  })
  .catch(console.error);

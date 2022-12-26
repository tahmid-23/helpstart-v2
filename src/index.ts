import * as dotenv from 'dotenv';
import { Client, Events } from 'discord.js';
import { BotInfoCommand } from './commands/bot-info.js';
import { Command } from './commands/command.js';
import { HelpCommand } from './commands/help.js';
import { HelpstartCommand } from './commands/helpstart.js';
import { Heap, PriorityQueue } from './util/priority-queue.js';
import { HelpstartRequest } from './helpstart/helpstart-request.js';
import { BasicBotRepository } from './bot/bot-repository.js';
import { BasicHelpstartExecutor } from './helpstart/executor/helpstart-executor.js';
import { MineflayerBot } from './bot/mineflayer-bot.js';
import {
  createDefaultWarpState,
  WarpStage
} from './helpstart/executor/stage/warp-stage.js';
import {
  INVITE_KEY,
  START_KEY,
  COMPLETION_KEY,
  WARP_KEY
} from './helpstart/executor/stage/stage-key.js';
import {
  createDefaultStartState,
  StartStage
} from './helpstart/executor/stage/start-stage.js';
import {
  InviteStage,
  createDefaultInviteState
} from './helpstart/executor/stage/invite-stage.js';
import {
  createDefaultCompletionState,
  CompletionStage
} from './helpstart/executor/stage/completion-stage.js';
import { REQUEST_COMPARATOR } from './helpstart/request-comparator.js';
import path from 'path';
import * as fs from 'fs/promises';

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
    [COMPLETION_KEY]: [new CompletionStage(), createDefaultCompletionState]
  },
  inviteStage,
  createDefaultInviteState,
  completionStage,
  createDefaultCompletionState
);

const botRepository = new BasicBotRepository();

const commands: Record<string, Command> = {
  botinfo: new BotInfoCommand(requests, botRepository, helpstartExecutor),
  helpstart: new HelpstartCommand(requests, botRepository),
  help: new HelpCommand()
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

const emailsPath = path.join(process.cwd(), 'accounts.json');

async function readBotConfig(): Promise<string[]> {
  try {
    await fs.writeFile(emailsPath, JSON.stringify([]), { flag: 'wx' });
    return [];
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (!code || code !== 'EEXIST') {
      throw error;
    }

    const contents = await fs.readFile(emailsPath, { encoding: 'utf-8' });
    if (!contents) {
      throw new Error('Failed to read bot config');
    }

    const jsonContents = JSON.parse(contents);
    if (!(jsonContents instanceof Array)) {
      throw new Error('Bot config is not an array');
    }

    const emails = [];
    for (const email of jsonContents) {
      if (typeof email !== 'string') {
        throw new Error('Bot config included non-string email');
      }

      emails.push(email);
    }

    return emails;
  }
}

readBotConfig()
  .then((emails) => {
    console.debug(`Logging in ${emails.length} bots`);
    for (const email of emails) {
      console.debug(`Logging in ${email}`);
      const hsBot = new MineflayerBot(email);
      hsBot.connect('hypixel.net').then(() => {
        botRepository.addBot(hsBot);

        const username = hsBot.username;
        hsBot.on('chat', (message) => {
          console.log(`${username}: ${message.ansiText}`);
        });
      });
    }
  })
  .catch(console.error);

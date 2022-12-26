import EventEmitter from 'events';
import { Bot } from 'mineflayer';
import { HelpstartBot } from './bot.js';
import { MineflayerBotAbstract } from './mineflayer-bot.js';

const USERNAME = 'username';
const EMAIL = 'email';
const HOST = 'host';
const PORT = 25565;

let bot: Bot;
let helpstartBot: HelpstartBot;

beforeEach(() => {
  bot = jest.mocked(new EventEmitter() as Bot);
  bot.quit = jest.fn().mockImplementation(() => {
    bot.emit('end', 'test');
  });
  helpstartBot = new (class extends MineflayerBotAbstract {
    protected createMineflayerBot(): Bot {
      return bot;
    }
  })(EMAIL);
});

afterEach(() => {
  if (helpstartBot.connected) {
    helpstartBot.disconnect();
  }
});

test('Initially disconnected', () => {
  expect(helpstartBot.connected).toBe(false);
});

test('Initially disconnected', () => {
  expect(helpstartBot.connected).toBe(false);
});

test('Throw if disconnect while not connected', () => {
  expect(helpstartBot.disconnect).toThrow;
});

test('Throw if disconnect while not connected', () => {
  expect(helpstartBot.disconnect).toThrow;
});

test('Connected after connection promise finishes', async () => {
  const connectPromise = helpstartBot.connect(HOST, PORT);
  bot.emit('spawn');
  await connectPromise;

  expect(helpstartBot.connected).toBe(true);
});

test('Name is correct', async () => {
  bot.username = USERNAME;

  const connectPromise = helpstartBot.connect(HOST, PORT);
  bot.emit('spawn');
  await connectPromise;

  expect(helpstartBot.username).toBe(USERNAME);
});

test('Throw if connect while connected', async () => {
  const connectPromise = helpstartBot.connect(HOST, PORT);
  bot.emit('spawn');
  await connectPromise;

  expect(helpstartBot.connect).toThrow();
});

test('Disconnecting after connection results in no longer being connected', (done) => {
  helpstartBot.once('end', () => {
    expect(helpstartBot.connected).toBe(false);
    done();
  });

  helpstartBot.connect(HOST, PORT).then(() => {
    helpstartBot.disconnect();
  });
  bot.emit('spawn');
});

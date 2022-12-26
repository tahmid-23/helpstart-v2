import EventEmitter from 'events';
import { Bot } from 'mineflayer';
import { MineflayerBotAbstract } from './mineflayer-bot.js';

const USERNAME = 'username';
const EMAIL = 'email';
const HOST = 'host';
const PORT = 25565;

test('Initially disconnected', () => {
  const helpstartBot = new (class extends MineflayerBotAbstract {
    protected createMineflayerBot(): Bot {
      return {} as Bot;
    }
  })(EMAIL);

  expect(helpstartBot.connected).toBe(false);
});

test('Initially disconnected', () => {
  const helpstartBot = new (class extends MineflayerBotAbstract {
    protected createMineflayerBot(): Bot {
      return {} as Bot;
    }
  })(EMAIL);

  expect(helpstartBot.connected).toBe(false);
});

test('Throw if disconnect while not connected', () => {
  const helpstartBot = new (class extends MineflayerBotAbstract {
    protected createMineflayerBot(): Bot {
      return {} as Bot;
    }
  })(EMAIL);

  expect(helpstartBot.disconnect).toThrow;
});

test('Throw if disconnect while not connected', () => {
  const helpstartBot = new (class extends MineflayerBotAbstract {
    protected createMineflayerBot(): Bot {
      return {} as Bot;
    }
  })(EMAIL);

  expect(helpstartBot.disconnect).toThrow;
});

test('Connected after connection promise finishes', async () => {
  const bot = new EventEmitter() as Bot;
  const helpstartBot = new (class extends MineflayerBotAbstract {
    protected createMineflayerBot(): Bot {
      return bot;
    }
  })(EMAIL);

  const connectPromise = helpstartBot.connect(HOST, PORT);
  bot.emit('spawn');
  await connectPromise;

  expect(helpstartBot.connected).toBe(true);
});

test('Name is correct', async () => {
  const bot = jest.mocked(new EventEmitter() as Bot);
  bot.username = USERNAME;
  const helpstartBot = new (class extends MineflayerBotAbstract {
    protected createMineflayerBot(): Bot {
      return bot;
    }
  })(EMAIL);

  const connectPromise = helpstartBot.connect(HOST, PORT);
  bot.emit('spawn');
  await connectPromise;

  expect(helpstartBot.username).toBe(USERNAME);
});

test('Throw if connect while connected', async () => {
  const bot = new EventEmitter() as Bot;
  const helpstartBot = new (class extends MineflayerBotAbstract {
    protected createMineflayerBot(): Bot {
      return bot;
    }
  })(EMAIL);

  const connectPromise = helpstartBot.connect(HOST, PORT);
  bot.emit('spawn');
  await connectPromise;

  expect(helpstartBot.connect).toThrow();
});

test('Disconnecting after connection results in no longer being connected', (done) => {
  const bot = jest.mocked(new EventEmitter() as Bot);
  bot.quit = jest.fn().mockImplementation(() => {
    bot.emit('end', 'test');
  });
  const helpstartBot = new (class extends MineflayerBotAbstract {
    protected createMineflayerBot(): Bot {
      return bot;
    }
  })(EMAIL);

  helpstartBot.once('end', () => {
    expect(helpstartBot.connected).toBe(false);
    done();
  });

  helpstartBot.connect(HOST, PORT).then(() => {
    helpstartBot.disconnect();
  });
  bot.emit('spawn');
});

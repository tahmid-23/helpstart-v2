import { HelpstartBot } from './bot.js';

export interface BotTransaction {
  bots: readonly HelpstartBot[];
  end(): void;
}

export interface BotRepository {
  readonly available: Map<string, HelpstartBot>;
  readonly busy: Map<string, HelpstartBot>;
  readonly online: Map<string, HelpstartBot>;

  addBot(bot: HelpstartBot): void;
  provideBots(count: number): BotTransaction;
}

class BasicTransaction implements BotTransaction {
  bots: readonly HelpstartBot[];
  private botEntries: readonly [string, HelpstartBot][];
  private busy: Map<string, HelpstartBot>;
  private available: Map<string, HelpstartBot>;

  constructor(
    botEntries: readonly [string, HelpstartBot][],
    busy: Map<string, HelpstartBot>,
    available: Map<string, HelpstartBot>
  ) {
    this.botEntries = botEntries;
    this.bots = botEntries.map((entry) => entry[1]);
    this.busy = busy;
    this.available = available;
  }

  end(): void {
    for (const [uuid, bot] of this.botEntries) {
      if (!bot.connected) {
        continue;
      }

      this.busy.delete(uuid);
      this.available.set(uuid, bot);
    }
  }
}

export class BasicBotRepository implements BotRepository {
  available: Map<string, HelpstartBot> = new Map();
  busy: Map<string, HelpstartBot> = new Map();
  online: Map<string, HelpstartBot> = new Map();

  addBot(bot: HelpstartBot): void {
    if (this.online.has(bot.uuid)) {
      throw new Error('Bot already present');
    }
    if (!bot.connected) {
      throw new Error('Bot must be online');
    }

    this.online.set(bot.uuid, bot);
    this.available.set(bot.uuid, bot);
    bot.chat('/language english');
    bot.chat('/party disband');
    bot.chat('/lobby arcade');
    bot.once('end', () => {
      this.available.delete(bot.uuid);
      this.busy.delete(bot.uuid);
      this.online.delete(bot.uuid);
    });
  }
  provideBots(count: number): BotTransaction {
    if (this.available.size < count) {
      throw new Error('Not enough available bots');
    }

    const bots = [...this.available].slice(0, count);
    for (const [uuid, bot] of bots) {
      this.available.delete(uuid);
      this.busy.set(uuid, bot);
    }

    return new BasicTransaction(bots, this.busy, this.available);
  }
}

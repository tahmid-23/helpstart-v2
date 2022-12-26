import EventEmitter from 'events';
import { createBot, Bot, BotOptions } from 'mineflayer';
import TypedEventEmitter from 'typed-emitter';
import { v4 as uuidv4 } from 'uuid';
import { GameDifficulty } from '../zombies/game-difficulty.js';
import { GameMap } from '../zombies/game-map.js';
import {
  HelpstartBot,
  HelpstartBotEvents,
  MicrosoftAuthHandler
} from './bot.js';
import * as vec3 from 'vec3';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Vec3 = (vec3.default as any).Vec3 as typeof vec3.Vec3;

export const DISCONNECT_REASON = 'manual';

export abstract class MineflayerBotAbstract
  extends (EventEmitter as new () => TypedEventEmitter<HelpstartBotEvents>)
  implements HelpstartBot
{
  readonly uuid: string;
  private readonly messageQueue: string[] = [];
  private readonly email: string;
  private readonly password?: string;
  private readonly chatDelay: number;
  private mineflayerBot?: Bot;
  private chatInterval: NodeJS.Timer | undefined;

  constructor(email: string, password?: string, chatDelay = 500) {
    super();
    this.uuid = uuidv4();
    this.email = email;
    this.password = password;
    this.chatDelay = chatDelay;
  }

  get username() {
    if (!this.mineflayerBot) {
      throw new Error('Bot is not connected');
    }

    return this.mineflayerBot.username;
  }

  get connected() {
    return this.mineflayerBot !== undefined;
  }

  chat(message: string): void {
    if (!this.mineflayerBot) {
      throw new Error('Bot is not connected');
    }

    this.messageQueue.push(message);
  }

  private getChestPos(map: Exclude<GameMap, GameMap.AA>) {
    switch (map) {
      case GameMap.DE:
        return new Vec3(16, 68, 17);
      case GameMap.BB:
        return new Vec3(21, 68, 12);
    }
  }

  checkChest(map: Exclude<GameMap, GameMap.AA>): void {
    if (!this.mineflayerBot) {
      throw new Error('Bot is not connected');
    }

    const chestPos = this.getChestPos(map);
    const block = this.mineflayerBot.blockAt(chestPos);
    if (block) {
      this.mineflayerBot.activateBlock(block);
    }
  }

  private getDifficultySlot(difficulty: GameDifficulty): number {
    switch (difficulty) {
      case GameDifficulty.NORMAL: {
        return 11;
      }
      case GameDifficulty.HARD: {
        return 13;
      }
      case GameDifficulty.RIP: {
        return 15;
      }
    }
  }

  setDifficulty(difficulty: GameDifficulty): void {
    if (!this.mineflayerBot) {
      throw new Error('Bot is not connected');
    }

    const bot = this.mineflayerBot;
    bot.setQuickBarSlot(4);
    const swingTimeout = setTimeout(() => {
      bot.swingArm('right');
      bot.once('windowOpen', () => {
        const clickTimeout = setTimeout(() => {
          bot.clickWindow(this.getDifficultySlot(difficulty), 0, 0);
        }, 1000);
        bot.once('end', () => clearTimeout(clickTimeout));
      });
    }, 1000);
    bot.once('end', () => clearTimeout(swingTimeout));
  }

  protected abstract createMineflayerBot(options: BotOptions): Bot;

  connect(
    host: string,
    port?: number,
    authHandler?: MicrosoftAuthHandler
  ): Promise<void> {
    if (this.mineflayerBot) {
      throw new Error('Bot is already connected');
    }

    return new Promise((resolve, reject) => {
      try {
        const bot = this.createMineflayerBot({
          host: host,
          port: port,
          username: this.email,
          password: this.password,
          auth: 'microsoft',
          version: '1.8.9',
          onMsaCode: authHandler
        });

        bot.once('spawn', () => {
          this.chatInterval = setInterval(() => {
            if (this.messageQueue.length > 0) {
              bot.chat(this.messageQueue[0]);
              this.messageQueue.splice(0, 1);
            }
          }, this.chatDelay);
          this.mineflayerBot = bot;
          resolve();
        });
        bot.on('message', (jsonMsg, position) => {
          if (position === 'game_info') {
            return;
          }

          this.emit('chat', {
            plainText: jsonMsg.toString(),
            ansiText: jsonMsg.toAnsi()
          });
        });
        bot.once('end', () => {
          this.messageQueue.splice(0, this.messageQueue.length);
          if (this.chatInterval) {
            clearInterval(this.chatInterval);
            this.chatInterval = undefined;
          }

          this.mineflayerBot = undefined;
          this.emit('end');
        });
        bot.on('error', console.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (!this.mineflayerBot) {
      throw new Error('Bot is not connected');
    }

    this.mineflayerBot.quit(DISCONNECT_REASON);
  }
}

export class MineflayerBot extends MineflayerBotAbstract {
  protected createMineflayerBot(options: BotOptions): Bot {
    return createBot(options);
  }
}

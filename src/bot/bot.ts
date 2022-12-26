import { MicrosoftDeviceAuthorizationResponse } from 'minecraft-protocol';
import TypedEventEmitter from 'typed-emitter';
import { GameDifficulty } from '../zombies/game-difficulty.js';
import { GameMap } from '../zombies/game-map.js';

export interface Message {
  plainText: string;
  ansiText: string;
}

export interface HelpstartBotEvents {
  chat: (message: Message) => void;
  end: () => void;
}

export type MicrosoftAuthHandler = (
  data: MicrosoftDeviceAuthorizationResponse
) => void;

export interface HelpstartBot extends TypedEventEmitter<HelpstartBotEvents> {
  readonly username: string;
  readonly uuid: string;
  readonly connected: boolean;
  chat(message: string): void;
  checkChest(map: Exclude<GameMap, GameMap.AA>): void;
  setDifficulty(difficulty: GameDifficulty): void;
  connect(
    host: string,
    port: number,
    authHandler?: MicrosoftAuthHandler
  ): Promise<void>;
  disconnect(): void;
}

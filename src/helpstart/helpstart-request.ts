import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  InteractionCollector
} from 'discord.js';
import { GameChest } from '../zombies/game-chest.js';
import { GameDifficulty } from '../zombies/game-difficulty.js';
import { GameMap } from '../zombies/game-map.js';

export enum ChestMode {
  WHITELIST,
  BLACKLIST,
  NONE
}

export function getChestModeDisplayName(mode: ChestMode): string {
  switch (mode) {
    case ChestMode.WHITELIST:
      return 'Good Chests';
    case ChestMode.BLACKLIST:
      return 'Bad Chests';
    case ChestMode.NONE:
      return 'None';
  }
}

export interface HelpstartRequest {
  interaction: ChatInputCommandInteraction<CacheType>;
  onComplete: () => void;
  map: GameMap;
  difficulty: GameDifficulty;
  players: readonly string[];
  chestMode: ChestMode;
  chests: readonly GameChest[];
}

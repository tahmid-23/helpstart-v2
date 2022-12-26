import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { Heap } from '../util/priority-queue.js';
import { GameChest } from '../zombies/game-chest.js';
import { GameDifficulty } from '../zombies/game-difficulty.js';
import { GameMap } from '../zombies/game-map.js';
import { ChestMode, HelpstartRequest } from './helpstart-request.js';
import { REQUEST_COMPARATOR } from './request-comparator.js';

test('Prioritize older requests', () => {
  const queue = new Heap<HelpstartRequest>(REQUEST_COMPARATOR);
  const interactionA = jest.mocked(
    {} as ChatInputCommandInteraction<CacheType>
  );
  interactionA.createdTimestamp = 1;
  const interactionB = jest.mocked(
    {} as ChatInputCommandInteraction<CacheType>
  );
  interactionB.createdTimestamp = 0;

  queue.push({
    interaction: interactionA,
    map: GameMap.DE,
    difficulty: GameDifficulty.NORMAL,
    players: [],
    chestMode: ChestMode.NONE,
    chests: []
  });
  queue.push({
    interaction: interactionB,
    map: GameMap.DE,
    difficulty: GameDifficulty.NORMAL,
    players: [],
    chestMode: ChestMode.NONE,
    chests: []
  });

  expect(queue.pop().interaction.createdTimestamp).toBe(0);
  expect(queue.pop().interaction.createdTimestamp).toBe(1);
});

test('Prioritize games without chests over timestamp', () => {
  const queue = new Heap<HelpstartRequest>(REQUEST_COMPARATOR);
  const interactionA = jest.mocked(
    {} as ChatInputCommandInteraction<CacheType>
  );
  interactionA.createdTimestamp = 1;
  const interactionB = jest.mocked(
    {} as ChatInputCommandInteraction<CacheType>
  );
  interactionB.createdTimestamp = 0;

  queue.push({
    interaction: interactionA,
    map: GameMap.DE,
    difficulty: GameDifficulty.NORMAL,
    players: [],
    chestMode: ChestMode.WHITELIST,
    chests: [GameChest.OFFICE]
  });
  queue.push({
    interaction: interactionB,
    map: GameMap.DE,
    difficulty: GameDifficulty.NORMAL,
    players: [],
    chestMode: ChestMode.NONE,
    chests: []
  });

  expect(queue.pop().interaction.createdTimestamp).toBe(1);
  expect(queue.pop().interaction.createdTimestamp).toBe(0);
});

test('Treat games with whitelisted chests but empty chests array as no chests', () => {
  const queue = new Heap<HelpstartRequest>(REQUEST_COMPARATOR);
  const interactionA = jest.mocked(
    {} as ChatInputCommandInteraction<CacheType>
  );
  interactionA.createdTimestamp = 1;
  const interactionB = jest.mocked(
    {} as ChatInputCommandInteraction<CacheType>
  );
  interactionB.createdTimestamp = 0;

  queue.push({
    interaction: interactionA,
    map: GameMap.DE,
    difficulty: GameDifficulty.NORMAL,
    players: [],
    chestMode: ChestMode.WHITELIST,
    chests: []
  });
  queue.push({
    interaction: interactionB,
    map: GameMap.DE,
    difficulty: GameDifficulty.NORMAL,
    players: [],
    chestMode: ChestMode.NONE,
    chests: []
  });

  expect(queue.pop().interaction.createdTimestamp).toBe(0);
  expect(queue.pop().interaction.createdTimestamp).toBe(1);
});

test('Treat games with chests but ChestMode None as no chests', () => {
  const queue = new Heap<HelpstartRequest>(REQUEST_COMPARATOR);
  const interactionA = jest.mocked(
    {} as ChatInputCommandInteraction<CacheType>
  );
  interactionA.createdTimestamp = 1;
  const interactionB = jest.mocked(
    {} as ChatInputCommandInteraction<CacheType>
  );
  interactionB.createdTimestamp = 0;

  queue.push({
    interaction: interactionA,
    map: GameMap.DE,
    difficulty: GameDifficulty.NORMAL,
    players: [],
    chestMode: ChestMode.NONE,
    chests: [GameChest.OFFICE]
  });
  queue.push({
    interaction: interactionB,
    map: GameMap.DE,
    difficulty: GameDifficulty.NORMAL,
    players: [],
    chestMode: ChestMode.NONE,
    chests: []
  });

  expect(queue.pop().interaction.createdTimestamp).toBe(0);
  expect(queue.pop().interaction.createdTimestamp).toBe(1);
});

test('Prioritize games with greater players over chest', () => {
  const queue = new Heap<HelpstartRequest>(REQUEST_COMPARATOR);
  const interactionA = jest.mocked(
    {} as ChatInputCommandInteraction<CacheType>
  );
  interactionA.createdTimestamp = 0;
  const interactionB = jest.mocked(
    {} as ChatInputCommandInteraction<CacheType>
  );
  interactionB.createdTimestamp = 1;
  const interactionC = jest.mocked(
    {} as ChatInputCommandInteraction<CacheType>
  );
  interactionC.createdTimestamp = 0;

  queue.push({
    interaction: interactionA,
    map: GameMap.DE,
    difficulty: GameDifficulty.NORMAL,
    players: ['Player 1', 'Player 2'],
    chestMode: ChestMode.NONE,
    chests: []
  });
  queue.push({
    interaction: interactionB,
    map: GameMap.DE,
    difficulty: GameDifficulty.NORMAL,
    players: ['Player 1'],
    chestMode: ChestMode.WHITELIST,
    chests: [GameChest.OFFICE]
  });
  queue.push({
    interaction: interactionC,
    map: GameMap.DE,
    difficulty: GameDifficulty.NORMAL,
    players: ['Player 1'],
    chestMode: ChestMode.NONE,
    chests: []
  });

  expect(queue.pop().players.length).toBe(2);
  expect(queue.pop().interaction.createdTimestamp).toBe(1);
  expect(queue.pop().interaction.createdTimestamp).toBe(0);
});

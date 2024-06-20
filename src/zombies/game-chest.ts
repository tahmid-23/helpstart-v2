import { GameMap } from './game-map.js';

export enum GameChest {
  APARTMENTS,
  GALLERY,
  HOTEL,
  OFFICE,
  POWER_STATION,

  BALCONY,
  CRYPTS,
  DUNGEON,
  LIBRARY,
  MANSION
}

export function getChestDisplayName(chest: GameChest): string {
  switch (chest) {
    case GameChest.APARTMENTS:
      return 'Apartments';
    case GameChest.GALLERY:
      return 'Gallery';
    case GameChest.HOTEL:
      return 'Hotel';
    case GameChest.OFFICE:
      return 'Office';
    case GameChest.POWER_STATION:
      return 'Power Station';
    case GameChest.BALCONY:
      return 'Balcony';
    case GameChest.CRYPTS:
      return 'Crypts';
    case GameChest.DUNGEON:
      return 'Dungeon';
    case GameChest.LIBRARY:
      return 'Library';
    case GameChest.MANSION:
      return 'Mansion';
  }
}

export function getMapChests(map: GameMap | undefined): readonly GameChest[] {
  switch (map) {
    case GameMap.DE:
      return [
        GameChest.APARTMENTS,
        GameChest.GALLERY,
        GameChest.HOTEL,
        GameChest.OFFICE,
        GameChest.POWER_STATION
      ];
    case GameMap.BB:
      return [
        GameChest.BALCONY,
        GameChest.CRYPTS,
        GameChest.DUNGEON,
        GameChest.LIBRARY,
        GameChest.MANSION
      ];
    case GameMap.AA:
      return [];
    case GameMap.PRISON:
      return [];
    default:
      return (
        Object.values(GameChest).filter(
          (map) => typeof map === 'string'
        ) as (keyof typeof GameChest)[]
      ).map((chestName) => GameChest[chestName]);
  }
}

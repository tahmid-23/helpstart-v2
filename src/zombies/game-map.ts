export enum GameMap {
  DE,
  BB,
  AA,
  PRISON
}

export function getMapDisplayName(map: GameMap): string {
  switch (map) {
    case GameMap.DE:
      return 'Dead End';
    case GameMap.BB:
      return 'Bad Blood';
    case GameMap.AA:
      return 'Alien Arcadium';
    case GameMap.PRISON:
      return 'Prison';
  }
}

export function getMapMinigameName(map: GameMap): string {
  switch (map) {
    case GameMap.DE:
      return 'arcade_zombies_dead_end';
    case GameMap.BB:
      return 'arcade_zombies_bad_blood';
    case GameMap.AA:
      return 'arcade_zombies_alien_arcadium';
    case GameMap.PRISON:
      return 'arcade_zombies_prison';
  }
}

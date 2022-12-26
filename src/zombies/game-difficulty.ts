export enum GameDifficulty {
  NORMAL,
  HARD,
  RIP
}

export function getDifficultyDisplayName(difficulty: GameDifficulty): string {
  switch (difficulty) {
    case GameDifficulty.NORMAL:
      return 'Normal';
    case GameDifficulty.HARD:
      return 'Hard';
    case GameDifficulty.RIP:
      return 'RIP';
  }
}

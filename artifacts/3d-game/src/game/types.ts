export type GamePhase =
  | 'MENU'
  | 'LOBBY'
  | 'WAITING_OPPONENT'
  | 'WAITING_PATTERN'
  | 'WAITING_RESULT'
  | 'SETTER_INPUT'
  | 'COMPUTER_SHOWS'
  | 'PLAYER_TURN'
  | 'SUCCESS'
  | 'FAIL'
  | 'GAME_OVER';

export type GridSize = 2 | 3 | 4;
export type TimeLimit = 3 | 5 | 10;
export type GymTheme = 'classic' | 'outdoor' | 'arcade';
export type PlayerMode = '1p' | '2p' | 'remote' | 'arcade';
export type FlashSpeed = 'relaxed' | 'normal' | 'fast' | 'blitz';

export interface GameSettings {
  gridSize: GridSize;
  timeLimit: TimeLimit;
  gym: GymTheme;
  playerMode: PlayerMode;
  flashSpeed: FlashSpeed;
}

export type BallAnimState = 'idle' | 'success' | 'miss';

export const HORSE_LETTERS = ['H', 'O', 'R', 'S', 'E'] as const;

export const MAX_SCORE = 1000;

export function getPatternLength(gridSize: GridSize): number {
  if (gridSize === 2) return 3;
  if (gridSize === 3) return 4;
  return 5;
}

export const FLASH_SPEED_VALUES: Record<FlashSpeed, { cellDuration: number; gapDuration: number }> = {
  relaxed: { cellDuration: 900, gapDuration: 400 },
  normal:  { cellDuration: 600, gapDuration: 300 },
  fast:    { cellDuration: 350, gapDuration: 180 },
  blitz:   { cellDuration: 200, gapDuration: 100 },
};

export const GYM_BG: Record<GymTheme, string> = {
  classic: '#0d0905',
  outdoor: '#05091a',
  arcade:  '#07050f',
};

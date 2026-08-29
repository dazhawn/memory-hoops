import { useState, useCallback } from 'react';

const STORAGE_KEY = 'horse_game_high_score';

function readHighScore(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {
  }
  return 0;
}

function writeHighScore(score: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
  }
}

export function useHighScore() {
  const [highScore, setHighScore] = useState<number>(readHighScore);

  const submitScore = useCallback(
    (score: number): boolean => {
      const current = readHighScore();
      if (score > current) {
        writeHighScore(score);
        setHighScore(score);
        return true;
      }
      return false;
    },
    [],
  );

  return { highScore, submitScore };
}

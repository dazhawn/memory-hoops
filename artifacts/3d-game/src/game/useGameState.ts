import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GamePhase,
  GameSettings,
  GridSize,
  FlashSpeed,
  BallAnimState,
  getPatternLength,
  FLASH_SPEED_VALUES,
  MAX_SCORE,
} from './types';
import { useHighScore } from './useHighScore';
import { useGameSounds } from './useGameSounds';

interface ArcadeConfig {
  gridSize: GridSize;
  flashSpeed: FlashSpeed;
  timeLimit: 3 | 5 | 10;
  pts: number;
  label: string;
}

function getArcadeRoundConfig(round: number): ArcadeConfig {
  if (round <= 2)  return { gridSize: 2, flashSpeed: 'normal', timeLimit: 5,  pts: 100, label: 'Normal' };
  if (round <= 5)  return { gridSize: 2, flashSpeed: 'fast',   timeLimit: 5,  pts: 150, label: 'Fast'   };
  if (round <= 8)  return { gridSize: 3, flashSpeed: 'fast',   timeLimit: 5,  pts: 250, label: 'Pro'    };
  if (round <= 11) return { gridSize: 3, flashSpeed: 'blitz',  timeLimit: 3,  pts: 350, label: 'Blitz'  };
  return                   { gridSize: 4, flashSpeed: 'blitz',  timeLimit: 3,  pts: 500, label: 'Master' };
}

export { getArcadeRoundConfig };

function generatePattern(gridSize: GridSize): number[] {
  const totalCells = gridSize * gridSize;
  const length = getPatternLength(gridSize);
  const cells = Array.from({ length: totalCells }, (_, i) => i);
  const shuffled = cells.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, length);
}

export function useGameState() {
  const { highScore, submitScore } = useHighScore();
  const {
    playCellTone,
    playCorrectTap,
    playWrongTap,
    playSuccess,
    playFail,
    playBasket,
    playGameOver,
    isMuted,
    toggleMute,
    resumeContext,
  } = useGameSounds();
  const [isNewBest, setIsNewBest] = useState(false);

  const [phase, setPhase] = useState<GamePhase>('MENU');
  const [isPaused, setIsPaused] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    gridSize: 2,
    timeLimit: 5,
    gym: 'classic',
    playerMode: '1p',
    flashSpeed: 'normal',
  });

  const [pattern, setPattern] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeCell, setActiveCell] = useState<number | null>(null);

  // 1P scoring
  const [score, setScore] = useState(0);
  const [playerLetters, setPlayerLetters] = useState(0);
  // 2P scoring
  const [p1Letters, setP1Letters] = useState(0);
  const [p2Letters, setP2Letters] = useState(0);
  // 2P turn tracking: who is currently SETTING the pattern
  const [setter, setSetter] = useState<1 | 2>(1);
  const [setterInput, setSetterInput] = useState<number[]>([]);
  // Pass-device overlay: whose turn is coming up (show briefly before flash)
  const [passDeviceFor, setPassDeviceFor] = useState<1 | 2 | null>(null);

  const [timeLeft, setTimeLeft] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [ballAnimState, setBallAnimState] = useState<BallAnimState>('idle');
  const [round, setRound] = useState(1);
  const [arcadeLives, setArcadeLives] = useState(3);
  const [message, setMessage] = useState('');

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const addTimeout = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  // ─── Flash the pattern, then start PLAYER_TURN ──────────────────────────────
  const startComputerShow = useCallback(
    (newSettings: GameSettings, currentRound: number, presetPattern?: number[]) => {
      clearAllTimeouts();
      const newPattern = presetPattern ?? generatePattern(newSettings.gridSize);
      setPattern(newPattern);
      setPlayerInput([]);
      setActiveCell(null);
      setPhase('COMPUTER_SHOWS');
      setBallAnimState('idle');

      const is2P = newSettings.playerMode === '2p';
      setMessage(is2P ? 'Memorize the pattern…' : 'Watch the pattern carefully…');

      const { cellDuration, gapDuration } = FLASH_SPEED_VALUES[newSettings.flashSpeed ?? 'normal'];
      const delay = 800;

      newPattern.forEach((cell, i) => {
        addTimeout(() => {
          setActiveCell(cell);
          playCellTone(cell);
        }, delay + i * (cellDuration + gapDuration));
        addTimeout(
          () => setActiveCell(null),
          delay + i * (cellDuration + gapDuration) + cellDuration,
        );
      });

      const totalTime = delay + newPattern.length * (cellDuration + gapDuration) + 400;
      addTimeout(() => {
        setPhase('PLAYER_TURN');
        setTimeLeft(newSettings.timeLimit);
        setTimerStarted(false);
        setMessage(is2P ? 'Repeat the pattern!' : 'Tap a cell to start the timer!');
      }, totalTime);
    },
    [playCellTone],
  );

  // ─── 2P: start the setter-input phase ───────────────────────────────────────
  const startSetterInput = useCallback((whoseSetter: 1 | 2, newRound?: number) => {
    clearAllTimeouts();
    setSetter(whoseSetter);
    setPhase('SETTER_INPUT');
    setSetterInput([]);
    setPlayerInput([]);
    setActiveCell(null);
    setBallAnimState('idle');
    setPassDeviceFor(null);
    if (newRound !== undefined) setRound(newRound);
    setMessage(`Player ${whoseSetter} — tap cells to set the pattern`);
  }, []);

  // ─── Game start ─────────────────────────────────────────────────────────────
  const startGame = useCallback(
    (newSettings: GameSettings) => {
      resumeContext();
      setSettings(newSettings);
      setScore(0);
      setPlayerLetters(0);
      setP1Letters(0);
      setP2Letters(0);
      setRound(1);
      setIsNewBest(false);

      if (newSettings.playerMode === '2p') {
        startSetterInput(1, 1);
      } else if (newSettings.playerMode === 'arcade') {
        const cfg = getArcadeRoundConfig(1);
        const arcadeSettings: GameSettings = { ...newSettings, gridSize: cfg.gridSize, flashSpeed: cfg.flashSpeed, timeLimit: cfg.timeLimit };
        setSettings(arcadeSettings);
        setArcadeLives(3);
        startComputerShow(arcadeSettings, 1);
      } else {
        startComputerShow(newSettings, 1);
      }
    },
    [startComputerShow, startSetterInput, resumeContext],
  );

  // ─── Restart / quit to menu ──────────────────────────────────────────────────
  const restartGame = useCallback(() => {
    clearAllTimeouts();
    setPhase('MENU');
    setIsPaused(false);
    setPattern([]);
    setPlayerInput([]);
    setActiveCell(null);
    setScore(0);
    setPlayerLetters(0);
    setP1Letters(0);
    setP2Letters(0);
    setSetter(1);
    setSetterInput([]);
    setPassDeviceFor(null);
    setTimeLeft(0);
    setBallAnimState('idle');
    setRound(1);
    setArcadeLives(3);
    setTimerStarted(false);
    setMessage('');
  }, []);

  // ─── 2P: setter taps cells to build a pattern ───────────────────────────────
  const handleSetterCellClick = useCallback(
    (cellIndex: number) => {
      if (phase !== 'SETTER_INPUT') return;
      const needed = getPatternLength(settings.gridSize);
      setSetterInput((prev) => {
        if (prev.includes(cellIndex)) {
          // Tap again to remove (toggle)
          return prev.filter((c) => c !== cellIndex);
        }
        if (prev.length >= needed) return prev;
        return [...prev, cellIndex];
      });
    },
    [phase, settings.gridSize],
  );

  const clearSetterInput = useCallback(() => {
    setSetterInput([]);
  }, []);

  // ─── 2P: setter confirms pattern → show pass-device screen → flash ──────────
  const confirmSetterPattern = useCallback(() => {
    const needed = getPatternLength(settings.gridSize);
    if (setterInput.length < needed) return;

    const capturedPattern = [...setterInput];
    const repeaterPlayer = setter === 1 ? 2 : 1;

    setSetterInput([]);
    setPassDeviceFor(repeaterPlayer);

    addTimeout(() => {
      setPassDeviceFor(null);
      startComputerShow(settings, round, capturedPattern);
    }, 2200);
  }, [setterInput, setter, settings, round, startComputerShow]);

  // ─── 1P/2P fail ─────────────────────────────────────────────────────────────
  const handleFail = useCallback(() => {
    clearAllTimeouts();
    setPhase('FAIL');
    setBallAnimState('miss');
    setMessage('Miss! You got a letter.');
    playFail();
  }, [playFail]);

  // ─── 1P/2P success ──────────────────────────────────────────────────────────
  const handleSuccess = useCallback(() => {
    clearAllTimeouts();
    setPhase('SUCCESS');
    setBallAnimState('success');
    setMessage('Swish! Nice shot!');
    playSuccess();
  }, [playSuccess]);

  // ─── Pause (only during active play, not setter input) ──────────────────────
  const togglePause = useCallback(() => {
    if (phase !== 'PLAYER_TURN' && phase !== 'COMPUTER_SHOWS') return;
    setIsPaused((p) => !p);
  }, [phase]);

  // ─── Countdown timer (PLAYER_TURN) ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'PLAYER_TURN') return;
    if (isPaused) return;
    if (!timerStarted) return;
    if (timeLeft <= 0) {
      handleFail();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft, isPaused, timerStarted, handleFail]);

  // ─── Player/repeater cell click ──────────────────────────────────────────────
  const handleCellClick = useCallback(
    (cellIndex: number) => {
      if (phase !== 'PLAYER_TURN') return;
      if (!timerStarted) setTimerStarted(true);

      const newInput = [...playerInput, cellIndex];
      const expected = pattern[newInput.length - 1];

      if (cellIndex !== expected) {
        playWrongTap();
        setPlayerInput(newInput);
        handleFail();
        return;
      }

      playCorrectTap();
      setPlayerInput(newInput);

      if (newInput.length === pattern.length) {
        handleSuccess();
      }
    },
    [phase, timerStarted, playerInput, pattern, handleFail, handleSuccess, playCorrectTap, playWrongTap],
  );

  // ─── After ball animation ends ───────────────────────────────────────────────
  const onBallAnimEnd = useCallback(() => {
    if (settings.playerMode === '2p') {
      // In 2P: repeater is non-setter
      const repeaterPlayer = setter === 1 ? 2 : 1;

      if (phase === 'FAIL') {
        // Repeater gets a letter
        if (repeaterPlayer === 1) {
          const newVal = p1Letters + 1;
          setP1Letters(newVal);
          if (newVal >= 5) {
            addTimeout(() => {
              setPhase('GAME_OVER');
              setMessage('Game Over! Player 2 wins!');
              playGameOver();
            }, 600);
            return;
          }
        } else {
          const newVal = p2Letters + 1;
          setP2Letters(newVal);
          if (newVal >= 5) {
            addTimeout(() => {
              setPhase('GAME_OVER');
              setMessage('Game Over! Player 1 wins!');
              playGameOver();
            }, 600);
            return;
          }
        }
      }

      // Toggle setter each round
      const nextSetter = setter === 1 ? 2 : 1;
      const nextRound = phase === 'SUCCESS' ? round + 1 : round;

      addTimeout(() => {
        setBallAnimState('idle');
        startSetterInput(nextSetter, nextRound);
      }, 800);
    } else if (settings.playerMode === 'arcade') {
      if (phase === 'SUCCESS') {
        const cfg = getArcadeRoundConfig(round);
        const nextRound = round + 1;
        const nextScore = score + cfg.pts;
        setRound(nextRound);
        setScore(nextScore);
        const nextCfg = getArcadeRoundConfig(nextRound);
        const nextSettings: GameSettings = { ...settings, gridSize: nextCfg.gridSize, flashSpeed: nextCfg.flashSpeed, timeLimit: nextCfg.timeLimit };
        setSettings(nextSettings);
        addTimeout(() => {
          setBallAnimState('idle');
          startComputerShow(nextSettings, nextRound);
        }, 400);
      } else if (phase === 'FAIL') {
        const newLives = arcadeLives - 1;
        setArcadeLives(newLives);
        if (newLives > 0) {
          addTimeout(() => {
            setMessage(`Miss! ${newLives} ${newLives === 1 ? 'life' : 'lives'} left`);
            setBallAnimState('idle');
            startComputerShow(settings, round);
          }, 800);
        } else {
          addTimeout(() => {
            setPhase('GAME_OVER');
            setMessage('Game Over!');
            playGameOver();
            const newBest = submitScore(score);
            setIsNewBest(newBest);
          }, 600);
        }
      }
    } else {
      // 1P mode: original logic
      if (phase === 'SUCCESS') {
        const nextRound = round + 1;
        const nextScore = score + 100;
        setRound(nextRound);
        setScore(nextScore);
        if (nextScore >= MAX_SCORE) {
          addTimeout(() => {
            setPhase('GAME_OVER');
            setMessage('You reached 1000! You win!');
            playGameOver();
            const newBest = submitScore(nextScore);
            setIsNewBest(newBest);
          }, 600);
          return;
        }
        addTimeout(() => {
          setBallAnimState('idle');
          startComputerShow(settings, nextRound);
        }, 400);
      } else if (phase === 'FAIL') {
        const newLetters = playerLetters + 1;
        setPlayerLetters(newLetters);
        if (newLetters >= 5) {
          addTimeout(() => {
            setPhase('GAME_OVER');
            setMessage('Game Over! You spelled HORSE!');
            playGameOver();
            const newBest = submitScore(score);
            setIsNewBest(newBest);
          }, 600);
        } else {
          addTimeout(() => {
            setBallAnimState('idle');
            startComputerShow(settings, round);
          }, 800);
        }
      }
    }
  }, [
    phase,
    score,
    round,
    arcadeLives,
    playerLetters,
    p1Letters,
    p2Letters,
    setter,
    settings,
    startComputerShow,
    startSetterInput,
    submitScore,
    playGameOver,
  ]);

  return {
    phase,
    isPaused,
    settings,
    pattern,
    playerInput,
    activeCell,
    // 1P
    score,
    playerLetters,
    // 2P
    p1Letters,
    p2Letters,
    setter,
    setterInput,
    passDeviceFor,
    timeLeft,
    timerStarted,
    ballAnimState,
    round,
    arcadeLives,
    message,
    highScore,
    isNewBest,
    startGame,
    restartGame,
    handleCellClick,
    handleSetterCellClick,
    clearSetterInput,
    confirmSetterPattern,
    onBallAnimEnd,
    togglePause,
    playBasket,
    isMuted,
    toggleMute,
  };
}

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  GamePhase,
  GameSettings,
  BallAnimState,
  getPatternLength,
  FLASH_SPEED_VALUES,
} from './types';
import { useGameSounds } from './useGameSounds';

export function useRemoteGame() {
  const wsRef = useRef<WebSocket | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const handleMsgRef = useRef<(e: MessageEvent) => void>(() => {});

  const {
    playCellTone, playCorrectTap, playWrongTap,
    playSuccess, playFail, playBasket,
    isMuted, toggleMute,
  } = useGameSounds();

  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [role, setRole] = useState<'host' | 'guest' | null>(null);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [settings, setSettings] = useState<GameSettings>({
    gridSize: 2, timeLimit: 5, gym: 'classic', playerMode: 'remote', flashSpeed: 'normal',
  });
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [ballAnimState, setBallAnimState] = useState<BallAnimState>('idle');
  const [round, setRound] = useState(1);
  const [message, setMessage] = useState('');
  const [p1Letters, setP1Letters] = useState(0);
  const [p2Letters, setP2Letters] = useState(0);
  const [setterIsHost, setSetterIsHost] = useState(true);
  const [setterInput, setSetterInput] = useState<number[]>([]);
  const [timerStarted, setTimerStarted] = useState(false);

  // Mutable refs to avoid stale closures in callbacks
  const phaseRef = useRef<GamePhase>('LOBBY');
  const roleRef = useRef<'host' | 'guest' | null>(null);
  const settingsRef = useRef<GameSettings>(settings);
  const patternRef = useRef<number[]>([]);
  const playerInputRef = useRef<number[]>([]);
  const isSetterRef = useRef(false);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const addTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id);
  }, []);

  const sendWs = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const runPatternFlash = useCallback(
    (pat: number[], gs: GameSettings) => {
      clearAllTimeouts();
      setPattern(pat);
      patternRef.current = pat;
      setPlayerInput([]);
      playerInputRef.current = [];
      setActiveCell(null);
      setPhase('COMPUTER_SHOWS');
      phaseRef.current = 'COMPUTER_SHOWS';
      setMessage('Memorize the pattern…');

      const { cellDuration, gapDuration } = FLASH_SPEED_VALUES[gs.flashSpeed];
      const delay = 800;

      pat.forEach((cell, i) => {
        addTimeout(() => { setActiveCell(cell); playCellTone(cell); },
          delay + i * (cellDuration + gapDuration));
        addTimeout(() => setActiveCell(null),
          delay + i * (cellDuration + gapDuration) + cellDuration);
      });

      const total = delay + pat.length * (cellDuration + gapDuration) + 400;
      addTimeout(() => {
        setPhase('PLAYER_TURN');
        phaseRef.current = 'PLAYER_TURN';
        setTimeLeft(gs.timeLimit);
        setTimerStarted(false);
        setMessage('Tap a cell to start the timer!');
      }, total);
    },
    [clearAllTimeouts, addTimeout, playCellTone],
  );

  const handleMessage = useCallback((event: MessageEvent) => {
    let msg: Record<string, unknown>;
    try { msg = JSON.parse(event.data as string) as Record<string, unknown>; }
    catch { return; }

    const type = msg.type as string;

    switch (type) {
      case 'room_created':
        setRoomId(msg.roomId as string);
        setRole('host'); roleRef.current = 'host';
        setPhase('WAITING_OPPONENT'); phaseRef.current = 'WAITING_OPPONENT';
        break;

      case 'room_joined':
        setRoomId(msg.roomId as string);
        setRole('guest'); roleRef.current = 'guest';
        setPhase('WAITING_OPPONENT'); phaseRef.current = 'WAITING_OPPONENT';
        break;

      case 'opponent_joined':
        setOpponentJoined(true);
        break;

      case 'game_started': {
        const gs = msg.settings as GameSettings;
        settingsRef.current = gs;
        setSettings(gs);
        setP1Letters(0); setP2Letters(0);
        setRound(1); setSetterIsHost(true);
        const iAmSetter = roleRef.current === 'host';
        isSetterRef.current = iAmSetter;
        if (iAmSetter) {
          setPhase('SETTER_INPUT'); phaseRef.current = 'SETTER_INPUT';
          setSetterInput([]);
          setMessage('You set the pattern! Tap cells.');
        } else {
          setPhase('WAITING_PATTERN'); phaseRef.current = 'WAITING_PATTERN';
          setMessage('Opponent is setting the pattern…');
        }
        break;
      }

      case 'pattern_received':
        runPatternFlash(msg.pattern as number[], settingsRef.current);
        break;

      case 'pattern_sent':
        setPhase('WAITING_RESULT'); phaseRef.current = 'WAITING_RESULT';
        setMessage('Pattern sent! Waiting for opponent…');
        break;

      case 'round_outcome': {
        const success = Boolean(msg.success);
        const hL = msg.hostLetters as number;
        const gL = msg.guestLetters as number;
        const nextSetterIsHost = Boolean(msg.nextSetterIsHost);
        const nextRound = msg.round as number;
        setP1Letters(hL); setP2Letters(gL);
        setRound(nextRound); setSetterIsHost(nextSetterIsHost);

        const wasRepeater = !isSetterRef.current;
        if (wasRepeater) {
          setBallAnimState(success ? 'success' : 'miss');
          setPhase(success ? 'SUCCESS' : 'FAIL');
          phaseRef.current = success ? 'SUCCESS' : 'FAIL';
          setMessage(success ? 'Swish! Nice shot!' : 'Miss! You got a letter.');
          if (success) playSuccess(); else playFail();
        } else {
          setBallAnimState('idle');
        }

        addTimeout(() => {
          setBallAnimState('idle');
          const iAmNextSetter = (roleRef.current === 'host') === nextSetterIsHost;
          isSetterRef.current = iAmNextSetter;
          if (iAmNextSetter) {
            setPhase('SETTER_INPUT'); phaseRef.current = 'SETTER_INPUT';
            setSetterInput([]); setMessage('Your turn to set! Tap cells.');
          } else {
            setPhase('WAITING_PATTERN'); phaseRef.current = 'WAITING_PATTERN';
            setMessage('Opponent is setting the pattern…');
          }
        }, wasRepeater ? 1400 : 600);
        break;
      }

      case 'game_over': {
        clearAllTimeouts();
        const winner = msg.winner as 'host' | 'guest';
        setP1Letters(msg.hostLetters as number);
        setP2Letters(msg.guestLetters as number);
        const iWon = winner === roleRef.current;
        setPhase('GAME_OVER'); phaseRef.current = 'GAME_OVER';
        setBallAnimState('idle');
        setMessage(iWon ? 'You win! 🏆' : 'Opponent wins!');
        break;
      }

      case 'opponent_disconnected':
        clearAllTimeouts();
        setPhase('LOBBY'); phaseRef.current = 'LOBBY';
        setOpponentJoined(false);
        setRemoteError('Opponent disconnected. Start a new room.');
        break;

      case 'error':
        setRemoteError(msg.message as string);
        break;
    }
  }, [runPatternFlash, playSuccess, playFail, clearAllTimeouts, addTimeout]);

  useEffect(() => { handleMsgRef.current = handleMessage; }, [handleMessage]);

  const connect = useCallback((onOpen?: () => void) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) { onOpen?.(); return; }
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      if (onOpen) wsRef.current.addEventListener('open', onOpen, { once: true });
      return;
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    wsRef.current = ws;
    ws.onopen = () => { setIsConnected(true); onOpen?.(); };
    ws.onclose = () => { setIsConnected(false); wsRef.current = null; };
    ws.onerror = () => setRemoteError('Connection failed. Is the server running?');
    ws.onmessage = (e) => handleMsgRef.current(e);
  }, []);

  const createRoom = useCallback(() => {
    setRemoteError(null);
    connect(() => sendWs({ type: 'create_room' }));
  }, [connect, sendWs]);

  const joinRoomByCode = useCallback((code: string) => {
    setRemoteError(null);
    connect(() => sendWs({ type: 'join_room', roomId: code }));
  }, [connect, sendWs]);

  const hostStartGame = useCallback((newSettings: GameSettings) => {
    settingsRef.current = newSettings;
    setSettings(newSettings);
    sendWs({ type: 'start_game', settings: newSettings });
  }, [sendWs]);

  const handleSetterCellClick = useCallback((cellIndex: number) => {
    if (phaseRef.current !== 'SETTER_INPUT') return;
    const needed = getPatternLength(settingsRef.current.gridSize);
    setSetterInput((prev) => {
      if (prev.includes(cellIndex)) return prev.filter((c) => c !== cellIndex);
      if (prev.length >= needed) return prev;
      return [...prev, cellIndex];
    });
  }, []);

  const clearSetterInput = useCallback(() => setSetterInput([]), []);

  const confirmSetterPattern = useCallback(() => {
    const needed = getPatternLength(settingsRef.current.gridSize);
    setSetterInput((prev) => {
      if (prev.length < needed) return prev;
      sendWs({ type: 'set_pattern', pattern: prev });
      return prev;
    });
  }, [sendWs]);

  const handleCellClick = useCallback((cellIndex: number) => {
    if (phaseRef.current !== 'PLAYER_TURN') return;
    setTimerStarted(true);
    const newInput = [...playerInputRef.current, cellIndex];
    const expected = patternRef.current[newInput.length - 1];
    playerInputRef.current = newInput;
    setPlayerInput(newInput);

    if (cellIndex !== expected) {
      playWrongTap();
      clearAllTimeouts();
      setPhase('FAIL'); phaseRef.current = 'FAIL';
      setBallAnimState('miss'); setMessage('Miss!');
      sendWs({ type: 'round_result', success: false });
      return;
    }
    playCorrectTap();
    if (newInput.length === patternRef.current.length) {
      clearAllTimeouts();
      setPhase('SUCCESS'); phaseRef.current = 'SUCCESS';
      setBallAnimState('success'); setMessage('Nice shot!');
      sendWs({ type: 'round_result', success: true });
    }
  }, [playWrongTap, playCorrectTap, clearAllTimeouts, sendWs]);

  // Countdown timer — doesn't start until timerStarted (first tap)
  useEffect(() => {
    if (phase !== 'PLAYER_TURN') return;
    if (!timerStarted) return;
    if (timeLeft <= 0) {
      clearAllTimeouts();
      setPhase('FAIL'); phaseRef.current = 'FAIL';
      setBallAnimState('miss'); setMessage('Time up! You got a letter.');
      playFail();
      sendWs({ type: 'round_result', success: false });
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timerStarted, timeLeft, clearAllTimeouts, playFail, sendWs]);

  const restartGame = useCallback(() => {
    clearAllTimeouts();
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false); setRoomId(null);
    setRole(null); roleRef.current = null;
    setOpponentJoined(false); setRemoteError(null);
    setPhase('LOBBY'); phaseRef.current = 'LOBBY';
    setPattern([]); patternRef.current = [];
    setPlayerInput([]); playerInputRef.current = [];
    setSetterInput([]); setP1Letters(0); setP2Letters(0);
    setRound(1); setBallAnimState('idle'); setMessage(''); setTimeLeft(0);
    setTimerStarted(false);
  }, [clearAllTimeouts]);

  useEffect(() => () => { clearAllTimeouts(); wsRef.current?.close(); }, [clearAllTimeouts]);

  const setterNum: 1 | 2 = setterIsHost ? 1 : 2;

  return {
    phase, isPaused: false as const, settings, pattern, playerInput,
    activeCell, score: 0, playerLetters: 0, p1Letters, p2Letters,
    setter: setterNum, setterInput, passDeviceFor: null as null,
    timeLeft, timerStarted, ballAnimState, round, message,
    highScore: 0, isNewBest: false as const,
    startGame: (_s: GameSettings) => {},
    restartGame, handleCellClick, handleSetterCellClick,
    clearSetterInput, confirmSetterPattern,
    onBallAnimEnd: () => {},
    togglePause: () => {},
    playBasket, isMuted, toggleMute,
    // remote-specific
    roomId, role, opponentJoined, isRemoteConnected: isConnected,
    remoteError, createRoom, joinRoomByCode, hostStartGame,
  };
}

import { useState, useCallback, useEffect } from 'react';
import { ACESFilmicToneMapping, PCFShadowMap } from 'three';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import { useGameState } from './game/useGameState';
import { useRemoteGame } from './game/useRemoteGame';
import { Court } from './game/Court';
import { Basketball } from './game/Basketball';
import { PatternGrid } from './game/PatternGrid';
import { GameHUD } from './game/GameHUD';
import { MenuScreen } from './game/MenuScreen';
import { GameOverScreen } from './game/GameOverScreen';
import { RemoteLobbyScreen } from './game/RemoteLobbyScreen';
import { GYM_BG, GymTheme, GameSettings, getPatternLength } from './game/types';
import { LeaderboardScreen } from './game/LeaderboardScreen';
import { apiUrl } from './lib/api';

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

const webGLSupported = isWebGLAvailable();

function SceneEffects({ gym }: { gym: GymTheme }) {
  return (
    <EffectComposer multisampling={4}>
      <SMAA />
      <Bloom
        intensity={gym === 'arcade' ? 2.2 : gym === 'outdoor' ? 0.8 : 0.35}
        luminanceThreshold={gym === 'arcade' ? 0.15 : gym === 'outdoor' ? 0.55 : 0.72}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.28} darkness={0.75} />
    </EffectComposer>
  );
}

function App() {
  // Always call both hooks — no conditional hook calls
  const localGame = useGameState();
  const remoteGame = useRemoteGame();

  const [isRemote, setIsRemote] = useState(false);

  // Switch between local and remote game state
  const game = isRemote ? remoteGame : localGame;

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardHighlightId, setLeaderboardHighlightId] = useState<number | undefined>(undefined);
  const [netRippling, setNetRippling] = useState(false);

  const handleNetRipple = useCallback(() => {
    setNetRippling(true);
    setTimeout(() => setNetRippling(false), 80);
    game.playBasket();
  }, [game.playBasket]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        game.togglePause();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [game.togglePause]);

  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('horse_player_name') ?? '');

  // Intercept start — remote mode goes to lobby instead of starting local game
  const handleStartGame = useCallback((settings: GameSettings, name: string) => {
    setPlayerName(name);
    if (settings.playerMode === 'remote') {
      setIsRemote(true);
      // Remote game starts in LOBBY phase already — nothing else needed here
    } else {
      setIsRemote(false);
      localGame.startGame(settings);
    }
  }, [localGame.startGame]);

  const submitArcadeScore = useCallback(async (name: string) => {
    try {
      const res = await fetch(apiUrl('/api/leaderboard'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score: localGame.score, round: localGame.round }),
      });
      const data = await res.json();
      return { rank: data.rank ?? null, id: data.entry?.id };
    } catch {
      return { rank: null };
    }
  }, [localGame.score, localGame.round]);

  const handleViewLeaderboard = useCallback((highlightId?: number) => {
    setLeaderboardHighlightId(highlightId);
    setShowLeaderboard(true);
  }, []);

  const handleBackToMenu = useCallback(() => {
    remoteGame.restartGame(); // disconnects WS, resets to LOBBY
    setIsRemote(false);
    // localGame is already showing MENU since we didn't call startGame on it
  }, [remoteGame.restartGame]);

  const showGrid =
    game.phase === 'SETTER_INPUT' ||
    game.phase === 'COMPUTER_SHOWS' ||
    game.phase === 'PLAYER_TURN';

  const showHUD =
    game.phase === 'SETTER_INPUT' ||
    game.phase === 'COMPUTER_SHOWS' ||
    game.phase === 'PLAYER_TURN' ||
    game.phase === 'SUCCESS' ||
    game.phase === 'FAIL' ||
    game.phase === 'WAITING_PATTERN' ||
    game.phase === 'WAITING_RESULT';

  const gym = game.settings.gym ?? 'classic';
  const bgColor = GYM_BG[gym];
  const envPreset = gym === 'outdoor' ? 'night' : gym === 'arcade' ? 'city' : 'warehouse';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', 'system-ui', sans-serif",
        background: bgColor,
      }}
    >
      {webGLSupported ? (
        <Canvas
          camera={{ position: [0, 5.5, 13], fov: 58 }}
          shadows={{ type: PCFShadowMap }}
          style={{ position: 'absolute', inset: 0 }}
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: ACESFilmicToneMapping,
            toneMappingExposure: gym === 'arcade' ? 0.75 : gym === 'outdoor' ? 1.1 : 1.0,
          }}
        >
          <color attach="background" args={[bgColor]} />
          <fog attach="fog" args={[bgColor, gym === 'outdoor' ? 20 : 25, gym === 'outdoor' ? 45 : 50]} />

          <ambientLight intensity={gym === 'arcade' ? 0.12 : gym === 'outdoor' ? 0.6 : 0.3} />
          <directionalLight
            position={[5, 12, 6]}
            intensity={gym === 'outdoor' ? 1.6 : gym === 'arcade' ? 0.15 : 1.0}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0005}
          />
          <spotLight
            position={[0, 14, 2]}
            intensity={gym === 'arcade' ? 0.3 : 0.8}
            angle={0.65}
            penumbra={0.7}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            target-position={[0, 0, -5]}
          />

          <Environment preset={envPreset} background={false} />

          <Court gym={gym} netRippling={netRippling} />
          <Basketball
            phase={game.phase}
            ballAnimState={game.ballAnimState}
            onAnimEnd={game.onBallAnimEnd}
            onNetRipple={handleNetRipple}
          />

          <SceneEffects gym={gym} />
        </Canvas>
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 30%, ${bgColor} 0%, #050505 70%)`,
          }}
        />
      )}

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>

        {/* ── Local menu ─────────────────────────────────────── */}
        {!isRemote && game.phase === 'MENU' && (
          <div style={{ pointerEvents: 'all', position: 'absolute', inset: 0 }}>
            <MenuScreen
              onStart={handleStartGame}
              highScore={localGame.highScore}
              onViewLeaderboard={() => handleViewLeaderboard()}
            />
          </div>
        )}

        {/* ── Remote lobby / waiting ──────────────────────────── */}
        {isRemote && (game.phase === 'LOBBY' || game.phase === 'WAITING_OPPONENT') && (
          <div style={{ pointerEvents: 'all', position: 'absolute', inset: 0 }}>
            <RemoteLobbyScreen
              phase={game.phase as 'LOBBY' | 'WAITING_OPPONENT'}
              role={remoteGame.role}
              roomId={remoteGame.roomId}
              opponentJoined={remoteGame.opponentJoined}
              remoteError={remoteGame.remoteError}
              onCreateRoom={remoteGame.createRoom}
              onJoinRoom={remoteGame.joinRoomByCode}
              onStartGame={remoteGame.hostStartGame}
              onBack={handleBackToMenu}
            />
          </div>
        )}

        {/* ── Remote waiting overlays (game in progress) ─────── */}
        {isRemote && (game.phase === 'WAITING_PATTERN' || game.phase === 'WAITING_RESULT') && (
          <div style={{
            pointerEvents: 'none', position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.65)', borderRadius: 16,
              padding: '18px 32px', border: '1px solid rgba(255,255,255,0.12)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4, letterSpacing: '0.08em' }}>
                {game.phase === 'WAITING_PATTERN' ? 'OPPONENT' : 'OPPONENT'}'S TURN
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {game.message}
              </div>
              <div style={{ fontSize: 22, marginTop: 8 }}>⌛</div>
            </div>
          </div>
        )}

        {/* ── Pattern grid ───────────────────────────────────── */}
        {showGrid && (
          <div
            style={{
              pointerEvents:
                (game.phase === 'PLAYER_TURN' || game.phase === 'SETTER_INPUT') &&
                !game.isPaused &&
                game.passDeviceFor === null
                  ? 'all'
                  : 'none',
            }}
          >
            <PatternGrid
              gridSize={game.settings.gridSize}
              activeCell={game.activeCell}
              playerInput={game.playerInput}
              pattern={game.pattern}
              phase={game.phase}
              onCellClick={game.handleCellClick}
              setterInput={game.setterInput}
              onSetterCellClick={game.handleSetterCellClick}
              onConfirmSetter={game.confirmSetterPattern}
              onClearSetter={game.clearSetterInput}
              patternLength={getPatternLength(game.settings.gridSize)}
            />
          </div>
        )}

        {/* ── HUD ────────────────────────────────────────────── */}
        {showHUD && (
          <GameHUD
            phase={game.phase}
            score={game.score}
            playerLetters={game.playerLetters}
            p1Letters={game.p1Letters}
            p2Letters={game.p2Letters}
            timeLeft={game.timeLeft}
            settings={game.settings}
            round={game.round}
            arcadeLives={game.arcadeLives}
            timerStarted={game.timerStarted}
            message={game.message}
            isPaused={game.isPaused}
            setter={game.setter}
            passDeviceFor={game.passDeviceFor}
            onTogglePause={game.togglePause}
            onQuitToMenu={isRemote ? handleBackToMenu : game.restartGame}
            isMuted={game.isMuted}
            onToggleMute={game.toggleMute}
          />
        )}

        {/* ── Game over ──────────────────────────────────────── */}
        {game.phase === 'GAME_OVER' && (
          <div style={{ pointerEvents: 'all', position: 'absolute', inset: 0 }}>
            <GameOverScreen
              playerLetters={game.playerLetters}
              p1Letters={game.p1Letters}
              p2Letters={game.p2Letters}
              playerMode={game.settings.playerMode}
              score={game.score}
              round={game.round}
              highScore={game.highScore}
              isNewBest={game.isNewBest}
              onRestart={isRemote ? handleBackToMenu : game.restartGame}
              defaultName={playerName}
              onSubmitScore={game.settings.playerMode === 'arcade' ? submitArcadeScore : undefined}
              onViewLeaderboard={game.settings.playerMode === 'arcade' ? handleViewLeaderboard : undefined}
            />
          </div>
        )}

        {/* ── Leaderboard overlay ────────────────────────────── */}
        {showLeaderboard && (
          <div style={{ pointerEvents: 'all', position: 'absolute', inset: 0 }}>
            <LeaderboardScreen
              onClose={() => setShowLeaderboard(false)}
              highlightId={leaderboardHighlightId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

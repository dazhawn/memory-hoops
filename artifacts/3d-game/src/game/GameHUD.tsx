import { GamePhase, GameSettings, PlayerMode, HORSE_LETTERS } from './types';
import { getArcadeRoundConfig } from './useGameState';

interface GameHUDProps {
  phase: GamePhase;
  score: number;
  playerLetters: number;
  p1Letters: number;
  p2Letters: number;
  timeLeft: number;
  timerStarted: boolean;
  settings: GameSettings;
  round: number;
  arcadeLives: number;
  message: string;
  isPaused: boolean;
  setter: 1 | 2;
  passDeviceFor: 1 | 2 | null;
  onTogglePause: () => void;
  onQuitToMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

function HorseLetters({ filled, label, highlight }: { filled: number; label?: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {label && (
        <span style={{ color: highlight ? '#f5a623' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
          {label}
        </span>
      )}
      <div style={{ display: 'flex', gap: 5 }}>
        {HORSE_LETTERS.map((letter, i) => (
          <div
            key={letter}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: i < filled ? '#e53935' : 'rgba(255,255,255,0.07)',
              border: i < filled ? '2px solid #c62828' : '2px solid rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 800,
              color: i < filled ? 'white' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s',
              boxShadow: i < filled ? '0 0 10px rgba(229,57,53,0.5)' : 'none',
            }}
          >
            {letter}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GameHUD({
  phase,
  score,
  playerLetters,
  p1Letters,
  p2Letters,
  timeLeft,
  timerStarted,
  settings,
  round,
  arcadeLives,
  message,
  isPaused,
  setter,
  passDeviceFor,
  onTogglePause,
  onQuitToMenu,
  isMuted,
  onToggleMute,
}: GameHUDProps) {
  const is2P = settings.playerMode === '2p';
  const isArcade = settings.playerMode === 'arcade';
  const arcadeCfg = isArcade ? getArcadeRoundConfig(round) : null;
  const repeater = setter === 1 ? 2 : 1;
  const isUrgent = phase === 'PLAYER_TURN' && timerStarted && timeLeft <= 3 && !isPaused;
  const canPause = phase === 'PLAYER_TURN' || phase === 'COMPUTER_SHOWS';

  return (
    <>
      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      >
        {/* Letters left / arcade badge */}
        {is2P ? (
          <div style={{ display: 'flex', gap: 14 }}>
            <HorseLetters filled={p1Letters} label="P1" highlight={phase === 'SETTER_INPUT' && setter === 1} />
            <HorseLetters filled={p2Letters} label="P2" highlight={phase === 'SETTER_INPUT' && setter === 2} />
          </div>
        ) : isArcade ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ fontSize: 18, opacity: i < arcadeLives ? 1 : 0.18, filter: i < arcadeLives ? 'drop-shadow(0 0 4px rgba(229,57,53,0.7))' : 'none', transition: 'all 0.3s' }}>❤️</span>
              ))}
            </div>
            <div style={{ padding: '2px 8px', borderRadius: 5, background: arcadeCfg?.flashSpeed === 'blitz' ? 'rgba(229,57,53,0.25)' : arcadeCfg?.flashSpeed === 'fast' ? 'rgba(245,166,35,0.2)' : 'rgba(102,187,106,0.18)', border: `1px solid ${arcadeCfg?.flashSpeed === 'blitz' ? 'rgba(229,57,53,0.5)' : arcadeCfg?.flashSpeed === 'fast' ? 'rgba(245,166,35,0.4)' : 'rgba(102,187,106,0.4)'}`, fontSize: 11, fontWeight: 800, color: arcadeCfg?.flashSpeed === 'blitz' ? '#ef5350' : arcadeCfg?.flashSpeed === 'fast' ? '#f5a623' : '#66BB6A', letterSpacing: '0.06em' }}>
              {arcadeCfg?.label ?? 'Normal'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>YOU</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {HORSE_LETTERS.map((letter, i) => (
                <div key={letter} style={{ width: 34, height: 34, borderRadius: 8, background: i < playerLetters ? '#e53935' : 'rgba(255,255,255,0.08)', border: i < playerLetters ? '2px solid #c62828' : '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: i < playerLetters ? 'white' : 'rgba(255,255,255,0.25)', transition: 'all 0.3s', transform: i < playerLetters ? 'scale(1.1)' : 'scale(1)', boxShadow: i < playerLetters ? '0 0 12px rgba(229,57,53,0.5)' : 'none' }}>{letter}</div>
              ))}
            </div>
          </div>
        )}

        {/* Round */}
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em' }}>
          {is2P && phase === 'SETTER_INPUT' ? `P${setter} SETS` : is2P ? `ROUND ${round}` : `${score} PTS`}
        </div>

        {/* Right: settings + pause */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em' }}>{settings.gridSize}×{settings.gridSize} GRID</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em' }}>{settings.timeLimit}s LIMIT</span>
          </div>
          <button
            onClick={onToggleMute}
            style={{
              pointerEvents: 'all',
              width: 38,
              height: 38,
              borderRadius: 8,
              border: isMuted ? '2px solid rgba(255,255,255,0.25)' : '2px solid rgba(255,255,255,0.18)',
              background: isMuted ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
              color: isMuted ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.65)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              transition: 'all 0.15s',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          {canPause && (
            <button
              onClick={onTogglePause}
              style={{
                pointerEvents: 'all',
                width: 38,
                height: 38,
                borderRadius: 8,
                border: '2px solid rgba(255,255,255,0.25)',
                background: isPaused ? 'rgba(245,166,35,0.25)' : 'rgba(255,255,255,0.08)',
                color: isPaused ? '#f5a623' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                transition: 'all 0.15s',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? '▶' : '⏸'}
            </button>
          )}
        </div>
      </div>

      {/* Setter phase banner */}
      {phase === 'SETTER_INPUT' && (
        <div
          style={{
            position: 'absolute',
            top: 76,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            padding: '8px 24px',
            borderRadius: 10,
            background: 'rgba(245,166,35,0.12)',
            border: '1px solid rgba(245,166,35,0.3)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ color: '#f5a623', fontSize: 15, fontWeight: 800, letterSpacing: '0.05em' }}>
            🏀 Player {setter} — Set Your Pattern
          </div>
        </div>
      )}

      {/* Timer */}
      {phase === 'PLAYER_TURN' && !isPaused && (
        <div style={{ position: 'absolute', top: 76, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {is2P && (
            <div style={{ color: '#f5a623', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>
              PLAYER {repeater}'S TURN
            </div>
          )}
          <div style={{ fontSize: 48, fontWeight: 900, color: !timerStarted ? 'rgba(255,255,255,0.25)' : isUrgent ? '#e53935' : '#f5a623', textShadow: !timerStarted ? 'none' : isUrgent ? '0 0 20px rgba(229,57,53,0.8)' : '0 0 20px rgba(245,166,35,0.6)', lineHeight: 1, fontFamily: 'monospace', transition: 'color 0.3s', animation: isUrgent && timeLeft <= 2 ? 'pulse 0.5s ease-in-out infinite' : 'none' }}>
            {timeLeft}
          </div>
          {!timerStarted ? (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', animation: 'pulse 1.2s ease-in-out infinite' }}>
              TAP TO START
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em' }}>SECONDS</div>
          )}
        </div>
      )}

      {/* Status message */}
      {message && (phase === 'SUCCESS' || phase === 'FAIL' || phase === 'COMPUTER_SHOWS') && !isPaused && (
        <div style={{ position: 'absolute', top: '44%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', padding: '12px 28px', borderRadius: 12, background: phase === 'SUCCESS' ? 'rgba(76,175,80,0.15)' : phase === 'FAIL' ? 'rgba(229,57,53,0.15)' : 'rgba(0,0,0,0.3)', border: phase === 'SUCCESS' ? '1px solid rgba(76,175,80,0.4)' : phase === 'FAIL' ? '1px solid rgba(229,57,53,0.4)' : '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', pointerEvents: 'none' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: phase === 'SUCCESS' ? '#66BB6A' : phase === 'FAIL' ? '#ef5350' : 'rgba(255,255,255,0.8)', letterSpacing: '0.03em' }}>
            {message}
          </div>
        </div>
      )}

      {/* Pass-device overlay (2P only) */}
      {passDeviceFor !== null && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', pointerEvents: 'all', zIndex: 10 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>📱</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>Hand the device to</div>
          <div style={{ fontSize: 64, fontWeight: 900, color: '#f5a623', textShadow: '0 0 40px rgba(245,166,35,0.5)', lineHeight: 1 }}>
            Player {passDeviceFor}
          </div>
          <div style={{ marginTop: 24, color: 'rgba(255,255,255,0.3)', fontSize: 13, letterSpacing: '0.08em' }}>Pattern will flash in a moment…</div>
        </div>
      )}

      {/* Pause menu */}
      {isPaused && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', pointerEvents: 'all' }}>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(18,12,6,0.92)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 20, padding: '40px 48px 36px', minWidth: 300, boxShadow: '0 8px 48px rgba(0,0,0,0.7)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>GAME PAUSED</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#f5a623', textShadow: '0 0 32px rgba(245,166,35,0.45)', lineHeight: 1, marginBottom: 8 }}>⏸</div>

            {/* Letter status in pause menu */}
            <div style={{ display: 'flex', gap: is2P ? 20 : 6, marginBottom: 32, marginTop: 4 }}>
              {is2P ? (
                <>
                  <HorseLetters filled={p1Letters} label="P1" />
                  <HorseLetters filled={p2Letters} label="P2" />
                </>
              ) : (
                HORSE_LETTERS.map((letter, i) => (
                  <div key={letter} style={{ width: 30, height: 30, borderRadius: 6, background: i < playerLetters ? '#e53935' : 'rgba(255,255,255,0.07)', border: i < playerLetters ? '2px solid #c62828' : '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: i < playerLetters ? 'white' : 'rgba(255,255,255,0.2)' }}>{letter}</div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              <button onClick={onTogglePause} style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: '2px solid rgba(245,166,35,0.5)', background: 'rgba(245,166,35,0.15)', color: '#f5a623', fontSize: 15, fontWeight: 800, letterSpacing: '0.1em', cursor: 'pointer', touchAction: 'manipulation' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,166,35,0.28)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245,166,35,0.15)'; }}>
                ▶ RESUME
              </button>
              <button onClick={onToggleMute} style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: isMuted ? '2px solid rgba(255,255,255,0.25)' : '2px solid rgba(255,255,255,0.12)', background: isMuted ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', color: isMuted ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', touchAction: 'manipulation' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isMuted ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'; }}>
                {isMuted ? '🔇 UNMUTE SOUND' : '🔊 MUTE SOUND'}
              </button>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <button onClick={onQuitToMenu} style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: '2px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', touchAction: 'manipulation' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}>
                ← MAIN MENU
              </button>
            </div>
            {phase === 'PLAYER_TURN' && <div style={{ marginTop: 20, color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em' }}>⏱ Timer is paused</div>}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.12); opacity: 0.8; }
        }
      `}</style>
    </>
  );
}

import { useState } from 'react';
import { GameSettings, GridSize, TimeLimit, GymTheme, PlayerMode, FlashSpeed } from './types';

interface MenuScreenProps {
  onStart: (settings: GameSettings, playerName: string) => void;
  highScore: number;
  onViewLeaderboard?: () => void;
}

const GRID_OPTIONS: { size: GridSize; label: string; desc: string }[] = [
  { size: 2, label: 'Easy', desc: '2×2 Grid · 3 cells' },
  { size: 3, label: 'Medium', desc: '3×3 Grid · 4 cells' },
  { size: 4, label: 'Hard', desc: '4×4 Grid · 5 cells' },
];

const TIME_OPTIONS: { limit: TimeLimit; label: string }[] = [
  { limit: 3, label: '3s' },
  { limit: 5, label: '5s' },
  { limit: 10, label: '10s' },
];

const FLASH_OPTIONS: { speed: import('./types').FlashSpeed; label: string; desc: string }[] = [
  { speed: 'relaxed', label: 'Relaxed', desc: 'Slow flash' },
  { speed: 'normal',  label: 'Normal',  desc: 'Standard' },
  { speed: 'fast',    label: 'Fast',    desc: 'Quick flash' },
  { speed: 'blitz',   label: 'Blitz',   desc: 'Lightning!' },
];

const GYM_OPTIONS: { gym: GymTheme; label: string; icon: string; desc: string }[] = [
  { gym: 'classic', label: 'Classic', icon: '🏀', desc: 'Wood floor gym' },
  { gym: 'outdoor', label: 'Outdoor', icon: '🌙', desc: 'Night street court' },
  { gym: 'arcade', label: 'Arcade', icon: '🕹️', desc: 'Neon cyber court' },
];

const btnBase: React.CSSProperties = {
  flex: 1,
  borderRadius: 10,
  cursor: 'pointer',
  transition: 'all 0.18s',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  textAlign: 'center',
};

export function MenuScreen({ onStart, highScore, onViewLeaderboard }: MenuScreenProps) {
  const [gridSize, setGridSize] = useState<GridSize>(2);
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(5);
  const [gym, setGym] = useState<GymTheme>('classic');
  const [playerMode, setPlayerMode] = useState<PlayerMode>('1p');
  const [flashSpeed, setFlashSpeed] = useState<FlashSpeed>('normal');
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('horse_player_name') ?? '');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 20);
    setPlayerName(val);
    localStorage.setItem('horse_player_name', val);
  };

  const handleStart = () => onStart({ gridSize, timeLimit, gym, playerMode, flashSpeed }, playerName.trim());

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10,5,2,0.82)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        overflowY: 'auto',
        padding: '20px 0',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.02em', color: '#e07c24', textShadow: '0 0 40px rgba(224,124,36,0.5), 0 4px 12px rgba(0,0,0,0.6)', lineHeight: 1 }}>
          Memory Hoops
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 10 }}>
          🏀 H·O·R·S·E Basketball Challenge
        </div>
      </div>

      {/* High score */}
      {highScore > 0 && playerMode === '1p' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 24px', background: 'rgba(224,124,36,0.12)', border: '1px solid rgba(224,124,36,0.3)', borderRadius: 24 }}>
          <span style={{ fontSize: 18 }}>🏆</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Best:</span>
          <span style={{ color: '#f5a623', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{highScore}</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>pts</span>
        </div>
      )}

      {/* How to play */}
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 24px', marginBottom: 22, maxWidth: 420, textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>HOW TO PLAY</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>
          {playerMode === '2p'
            ? <>Player 1 taps cells to <b style={{ color: '#e07c24' }}>set a pattern</b>. Player 2 must repeat it in order before time runs out. Fail and earn a letter — spell <span style={{ color: '#e07c24', fontWeight: 700 }}>HORSE</span> and you lose!</>
            : <>Watch the grid light up in a pattern, then repeat it in the same order before time runs out. Miss a shot and earn a letter. Spell <span style={{ color: '#e07c24', fontWeight: 700 }}>HORSE</span> and you lose!</>}
        </div>
      </div>

      {/* Player Mode */}
      <div style={{ marginBottom: 22, width: '100%', maxWidth: 420, padding: '0 20px' }}>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
          Players
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {([
            { mode: '1p' as PlayerMode, label: '1 Player', icon: '🤖', desc: 'vs Computer' },
            { mode: '2p' as PlayerMode, label: '2 Players', icon: '👥', desc: 'Hot-seat' },
            { mode: 'remote' as PlayerMode, label: 'Remote', icon: '🌐', desc: 'Play online' },
            { mode: 'arcade' as PlayerMode, label: 'Arcade', icon: '🕹️', desc: 'Leaderboard' },
          ]).map((opt) => (
            <button
              key={opt.mode}
              onClick={() => setPlayerMode(opt.mode)}
              style={{
                ...btnBase,
                flex: 1,
                padding: '12px 6px',
                border: playerMode === opt.mode ? '2px solid #e07c24' : '2px solid rgba(255,255,255,0.12)',
                background: playerMode === opt.mode ? 'rgba(224,124,36,0.2)' : 'rgba(255,255,255,0.05)',
                color: playerMode === opt.mode ? '#f5a623' : 'rgba(255,255,255,0.5)',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{opt.label}</div>
              <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Court */}
      <div style={{ marginBottom: 22, width: '100%', maxWidth: 420, padding: '0 20px' }}>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>Court</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {GYM_OPTIONS.map((opt) => (
            <button key={opt.gym} onClick={() => setGym(opt.gym)} style={{ ...btnBase, padding: '12px 6px', border: gym === opt.gym ? '2px solid #e07c24' : '2px solid rgba(255,255,255,0.12)', background: gym === opt.gym ? 'rgba(224,124,36,0.2)' : 'rgba(255,255,255,0.05)', color: gym === opt.gym ? '#f5a623' : 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{opt.label}</div>
              <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Flash speed — difficulty lever */}
      {playerMode !== 'remote' && playerMode !== 'arcade' && (
        <div style={{ marginBottom: 22, width: '100%', maxWidth: 420, padding: '0 20px' }}>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
            Flash Speed
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {FLASH_OPTIONS.map((opt) => (
              <button key={opt.speed} onClick={() => setFlashSpeed(opt.speed)} style={{ ...btnBase, padding: '12px 6px', border: flashSpeed === opt.speed ? '2px solid #e07c24' : '2px solid rgba(255,255,255,0.12)', background: flashSpeed === opt.speed ? 'rgba(224,124,36,0.2)' : 'rgba(255,255,255,0.05)', color: flashSpeed === opt.speed ? '#f5a623' : 'rgba(255,255,255,0.5)' }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{opt.label}</div>
                <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Arcade info blurb */}
      {playerMode === 'arcade' && (
        <div style={{ marginBottom: 18, width: '100%', maxWidth: 420, padding: '14px 20px', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#f5a623', fontWeight: 700, marginBottom: 4 }}>🕹️ Arcade Mode</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>3 lives. Difficulty escalates every 5 levels.<br/>Scores are saved to the global leaderboard.</div>
        </div>
      )}

      {/* Grid size */}
      {playerMode !== 'arcade' && (
      <div style={{ marginBottom: 22, width: '100%', maxWidth: 420, padding: '0 20px' }}>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>Grid Size</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {GRID_OPTIONS.map((opt) => (
            <button key={opt.size} onClick={() => setGridSize(opt.size)} style={{ ...btnBase, padding: '14px 8px', border: gridSize === opt.size ? '2px solid #e07c24' : '2px solid rgba(255,255,255,0.12)', background: gridSize === opt.size ? 'rgba(224,124,36,0.2)' : 'rgba(255,255,255,0.05)', color: gridSize === opt.size ? '#f5a623' : 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{opt.label}</div>
              <div style={{ fontSize: 11, marginTop: 3, opacity: 0.7 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Time limit */}
      <div style={{ marginBottom: 28, width: '100%', maxWidth: 420, padding: '0 20px' }}>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
          {playerMode === '2p' ? 'Time to Repeat (P2)' : 'Time to Repeat'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {TIME_OPTIONS.map((opt) => (
            <button key={opt.limit} onClick={() => setTimeLimit(opt.limit)} style={{ ...btnBase, padding: '14px 8px', border: timeLimit === opt.limit ? '2px solid #e07c24' : '2px solid rgba(255,255,255,0.12)', background: timeLimit === opt.limit ? 'rgba(224,124,36,0.2)' : 'rgba(255,255,255,0.05)', color: timeLimit === opt.limit ? '#f5a623' : 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: 800 }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Player name */}
      <div style={{ marginBottom: 22, width: '100%', maxWidth: 420, padding: '0 20px' }}>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
          Your Name
        </div>
        <input
          value={playerName}
          onChange={handleNameChange}
          placeholder="Enter your name…"
          maxLength={20}
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 16, fontWeight: 600, outline: 'none', textAlign: 'center', caretColor: '#f5a623' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(224,124,36,0.6)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
        />
      </div>

      {/* Leaderboard link */}
      {onViewLeaderboard && (
        <button
          onClick={onViewLeaderboard}
          style={{ marginBottom: 14, padding: '10px 28px', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, cursor: 'pointer', touchAction: 'manipulation' }}
        >
          🏆 View Leaderboard
        </button>
      )}

      {/* Start */}
      <button
        onClick={handleStart}
        style={{ padding: '18px 72px', fontSize: 20, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1a0f06', background: 'linear-gradient(135deg, #f5a623 0%, #e06c1e 100%)', border: 'none', borderRadius: 14, cursor: 'pointer', boxShadow: '0 4px 24px rgba(224,124,36,0.4), 0 2px 8px rgba(0,0,0,0.4)', transition: 'transform 0.15s, box-shadow 0.15s', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(224,124,36,0.5), 0 4px 12px rgba(0,0,0,0.5)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(224,124,36,0.4), 0 2px 8px rgba(0,0,0,0.4)'; }}
      >
        🏀 Play
      </button>
    </div>
  );
}

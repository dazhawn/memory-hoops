import { useEffect, useState } from 'react';
import { HORSE_LETTERS, PlayerMode } from './types';

interface GameOverScreenProps {
  playerLetters: number;
  p1Letters?: number;
  p2Letters?: number;
  playerMode?: PlayerMode;
  score: number;
  round?: number;
  highScore: number;
  isNewBest: boolean;
  onRestart: () => void;
  defaultName?: string;
  onSubmitScore?: (name: string) => Promise<{ rank: number | null; id?: number }>;
  onViewLeaderboard?: (highlightId?: number) => void;
}

const btnStyle = (primary = false): React.CSSProperties => ({
  padding: '15px 44px', fontSize: 16, fontWeight: 800, letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  color: primary ? '#1a0f06' : '#fff',
  background: primary
    ? 'linear-gradient(135deg,#f5a623,#e06c1e)'
    : 'rgba(255,255,255,0.07)',
  border: primary ? 'none' : '1px solid rgba(255,255,255,0.2)',
  borderRadius: 12, cursor: 'pointer',
  boxShadow: primary ? '0 4px 20px rgba(224,124,36,0.4)' : 'none',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  transition: 'transform 0.15s',
});

export function GameOverScreen({
  playerLetters, p1Letters = 0, p2Letters = 0,
  playerMode = '1p', score, round = 0,
  highScore, isNewBest, onRestart,
  defaultName,
  onSubmitScore, onViewLeaderboard,
}: GameOverScreenProps) {
  const isArcade = playerMode === 'arcade';
  const is2P = playerMode === '2p';
  const isRemote = playerMode === 'remote';

  const p2Won = (is2P || isRemote) && p1Letters >= 5;
  const p1Won = (is2P || isRemote) && p2Letters >= 5;
  const winner = p2Won ? 2 : p1Won ? 1 : null;
  const isFullHorse = !is2P && !isRemote && !isArcade && playerLetters >= 5;

  const [name, setName] = useState(defaultName ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (defaultName) setName(defaultName);
  }, [defaultName]);
  const [rank, setRank] = useState<number | null>(null);
  const [submittedId, setSubmittedId] = useState<number | undefined>(undefined);

  const handleSubmit = async () => {
    if (!name.trim() || !onSubmitScore) return;
    setSubmitting(true);
    try {
      const result = await onSubmitScore(name.trim());
      setRank(result.rank);
      setSubmittedId(result.id);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const headlineColor = isArcade ? '#f5a623' : (is2P || isRemote) ? '#f5a623' : isFullHorse ? '#ef5350' : '#66BB6A';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,2,1,0.88)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: '20px' }}>

      <div style={{ fontSize: 48, fontWeight: 900, color: headlineColor, textShadow: `0 0 40px ${headlineColor}80`, letterSpacing: '-0.02em', marginBottom: 6 }}>
        {isArcade ? 'Game Over!' : (is2P || isRemote) ? `Player ${winner} Wins!` : isFullHorse ? 'Game Over!' : 'You Win!'}
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 22, letterSpacing: '0.04em' }}>
        {isArcade ? `Reached Level ${round}` : (is2P || isRemote) ? `Player ${winner === 1 ? 2 : 1} spelled HORSE` : isFullHorse ? "You've been HORSE'd" : 'The computer gave up!'}
      </div>

      {/* ── Arcade score card + submit ──────────────────────────────── */}
      {isArcade && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 22, padding: '20px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, width: '100%', maxWidth: 360 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Score</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#f5a623', lineHeight: 1 }}>{score.toLocaleString()}</div>
            </div>
            <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Level</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{round}</div>
            </div>
            <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Best</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: isNewBest ? '#66BB6A' : 'rgba(255,255,255,0.65)', lineHeight: 1 }}>{highScore.toLocaleString()}</div>
            </div>
          </div>
          {isNewBest && <div style={{ padding: '5px 16px', borderRadius: 20, background: 'linear-gradient(135deg,#66BB6A,#43A047)', color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', boxShadow: '0 0 20px rgba(102,187,106,0.5)' }}>🏆 New Best!</div>}

          {onSubmitScore && !submitted && (
            <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Post your score to the leaderboard</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                placeholder="Your name"
                maxLength={20}
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && !submitting && handleSubmit()}
                style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', textAlign: 'center' }}
              />
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || submitting}
                style={{ padding: '10px', borderRadius: 10, border: 'none', cursor: name.trim() && !submitting ? 'pointer' : 'not-allowed', background: name.trim() && !submitting ? 'linear-gradient(135deg,#f5a623,#e06c1e)' : 'rgba(255,255,255,0.08)', color: name.trim() && !submitting ? '#1a0f06' : 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: 14, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Submitting…' : 'Submit Score'}
              </button>
            </div>
          )}
          {submitted && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>
                {rank && rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : '✅'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: rank && rank <= 3 ? '#f5a623' : '#66BB6A' }}>
                {rank ? `You're #${rank} on the leaderboard!` : 'Score submitted!'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 2P / Remote ──────────────────────────────────────────────── */}
      {(is2P || isRemote) && (
        <div style={{ display: 'flex', gap: 28, marginBottom: 24, padding: '18px 28px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}>
          {[{ label: 'Player 1', letters: p1Letters, won: p1Won }, { label: 'Player 2', letters: p2Letters, won: p2Won }].map(({ label, letters, won }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: won ? '#66BB6A' : 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{label} {won ? '🏆' : ''}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {HORSE_LETTERS.map((letter, i) => (
                  <div key={letter} style={{ width: 40, height: 40, borderRadius: 9, background: i < letters ? '#c62828' : 'rgba(255,255,255,0.06)', border: i < letters ? '2px solid #e53935' : '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: i < letters ? 'white' : 'rgba(255,255,255,0.2)', boxShadow: i < letters ? '0 0 12px rgba(229,57,53,0.4)' : 'none' }}>{letter}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 1P ────────────────────────────────────────────────────────── */}
      {!isArcade && !is2P && !isRemote && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, padding: '18px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Score</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: '#f5a623', lineHeight: 1 }}>{score}<span style={{ fontSize: 13, fontWeight: 600, marginLeft: 4, opacity: 0.7 }}>pts</span></div>
            </div>
            <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Best</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: isNewBest ? '#66BB6A' : 'rgba(255,255,255,0.7)', lineHeight: 1 }}>{highScore}</div>
            </div>
          </div>
          {isNewBest && <div style={{ marginBottom: 14, padding: '5px 16px', borderRadius: 20, background: 'linear-gradient(135deg,#66BB6A,#43A047)', color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', boxShadow: '0 0 20px rgba(102,187,106,0.5)' }}>🏆 New Best!</div>}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {HORSE_LETTERS.map((letter, i) => (
              <div key={letter} style={{ width: 52, height: 52, borderRadius: 11, background: i < playerLetters ? '#c62828' : 'rgba(255,255,255,0.06)', border: i < playerLetters ? '2px solid #e53935' : '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: i < playerLetters ? 'white' : 'rgba(255,255,255,0.2)', boxShadow: i < playerLetters ? '0 0 16px rgba(229,57,53,0.4)' : 'none' }}>{letter}</div>
            ))}
          </div>
        </>
      )}

      {/* ── Buttons ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onRestart} style={btnStyle(true)}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          🏀 Play Again
        </button>
        {isArcade && onViewLeaderboard && (
          <button onClick={() => onViewLeaderboard(submittedId)} style={btnStyle(false)}>
            🏆 Leaderboard
          </button>
        )}
      </div>
    </div>
  );
}

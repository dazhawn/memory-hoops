import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';

interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  round: number;
  createdAt: string;
}

interface Props {
  onClose: () => void;
  highlightId?: number;
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)',
  fontFamily: "'Inter', system-ui, sans-serif",
  padding: '24px 16px',
};

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardScreen({ onClose, highlightId }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl('/api/leaderboard'))
      .then((r) => r.json())
      .then((data: LeaderboardEntry[]) => { setEntries(data); setLoading(false); })
      .catch(() => { setError('Could not load leaderboard.'); setLoading(false); });
  }, []);

  return (
    <div style={overlay}>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#f5a623', marginBottom: 4, letterSpacing: '-0.02em' }}>
        🏆 Leaderboard
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 28, letterSpacing: '0.08em' }}>
        ARCADE MODE · TOP 10
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0' }}>Loading…</div>
        )}
        {error && (
          <div style={{ textAlign: 'center', color: '#ff7b7b', padding: '40px 0' }}>{error}</div>
        )}
        {!loading && !error && entries.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px 0' }}>
            No scores yet — be the first!
          </div>
        )}
        {!loading && !error && entries.map((entry, i) => {
          const isHighlight = entry.id === highlightId;
          return (
            <div
              key={entry.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 16px', marginBottom: 8, borderRadius: 12,
                background: isHighlight
                  ? 'rgba(245,166,35,0.18)'
                  : i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                border: isHighlight
                  ? '1px solid rgba(245,166,35,0.4)'
                  : '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 32, textAlign: 'center', fontSize: i < 3 ? 22 : 15, fontWeight: 800, color: i < 3 ? undefined : 'rgba(255,255,255,0.35)' }}>
                {i < 3 ? MEDALS[i] : `#${i + 1}`}
              </div>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: isHighlight ? '#f5a623' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.name}
                {isHighlight && <span style={{ marginLeft: 8, fontSize: 11, color: '#f5a623', opacity: 0.8 }}>← you</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f5a623' }}>{entry.score.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Lvl {entry.round}</div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: 28, padding: '13px 40px', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.07)',
          color: '#fff', fontWeight: 700, fontSize: 15,
          cursor: 'pointer', letterSpacing: '0.03em',
        }}
      >
        Close
      </button>
    </div>
  );
}

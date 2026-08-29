import { useState } from 'react';
import type { GameSettings, GridSize, TimeLimit, FlashSpeed, GymTheme } from './types';

interface RemoteLobbyScreenProps {
  phase: 'LOBBY' | 'WAITING_OPPONENT';
  role: 'host' | 'guest' | null;
  roomId: string | null;
  opponentJoined: boolean;
  remoteError: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onStartGame: (settings: GameSettings) => void;
  onBack: () => void;
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 100,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.92)', color: '#fff',
  fontFamily: "'Inter', system-ui, sans-serif",
  padding: '24px 20px',
};

const card: React.CSSProperties = {
  width: '100%', maxWidth: 400,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 18, padding: '28px 24px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
};

const bigBtn = (active = true): React.CSSProperties => ({
  width: '100%', padding: '14px 20px', borderRadius: 12,
  border: 'none', cursor: active ? 'pointer' : 'not-allowed',
  fontWeight: 800, fontSize: 16, letterSpacing: '0.02em',
  transition: 'opacity 0.15s',
  opacity: active ? 1 : 0.45,
  background: active ? 'linear-gradient(135deg,#e07c24,#c25f10)' : '#444',
  color: '#fff', boxShadow: active ? '0 4px 16px rgba(224,124,36,0.35)' : 'none',
});

const smBtn = (sel = false): React.CSSProperties => ({
  flex: 1, padding: '10px 6px', borderRadius: 10,
  border: sel ? '2px solid #e07c24' : '2px solid rgba(255,255,255,0.1)',
  background: sel ? 'rgba(224,124,36,0.18)' : 'rgba(255,255,255,0.04)',
  color: sel ? '#f5a623' : 'rgba(255,255,255,0.55)',
  cursor: 'pointer', fontWeight: 700, fontSize: 13,
});

const codeBox: React.CSSProperties = {
  background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(255,165,0,0.4)',
  borderRadius: 12, padding: '16px 28px', fontSize: 36, fontWeight: 900,
  letterSpacing: '0.22em', color: '#f5a623', textAlign: 'center',
};

export function RemoteLobbyScreen({
  phase, role, roomId, opponentJoined, remoteError,
  onCreateRoom, onJoinRoom, onStartGame, onBack,
}: RemoteLobbyScreenProps) {
  const [mode, setMode] = useState<'choose' | 'join'>('choose');
  const [codeInput, setCodeInput] = useState('');
  const [gridSize, setGridSize] = useState<GridSize>(2);
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(5);
  const [flashSpeed, setFlashSpeed] = useState<FlashSpeed>('normal');
  const [gym] = useState<GymTheme>('classic');

  /* ── WAITING_OPPONENT (host) ─────────────────────────────── */
  if (phase === 'WAITING_OPPONENT' && role === 'host') {
    return (
      <div style={overlay}>
        <div style={card}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Room Code</div>
          <div style={codeBox}>{roomId}</div>

          <div style={{ fontSize: 13, color: opponentJoined ? '#6be06b' : 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            {opponentJoined ? '✓ Opponent connected!' : '⌛ Waiting for opponent to join…'}
          </div>

          {/* Settings */}
          <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
            <Label>Grid Size</Label>
            <Row>
              {([{s:2,l:'2×2'},{s:3,l:'3×3'},{s:4,l:'4×4'}] as {s:GridSize;l:string}[]).map(o => (
                <button key={o.s} style={smBtn(gridSize===o.s)} onClick={() => setGridSize(o.s)}>{o.l}</button>
              ))}
            </Row>
          </div>
          <div style={{ width: '100%' }}>
            <Label>Time Limit</Label>
            <Row>
              {([{t:3,l:'3s'},{t:5,l:'5s'},{t:10,l:'10s'}] as {t:TimeLimit;l:string}[]).map(o => (
                <button key={o.t} style={smBtn(timeLimit===o.t)} onClick={() => setTimeLimit(o.t)}>{o.l}</button>
              ))}
            </Row>
          </div>
          <div style={{ width: '100%' }}>
            <Label>Flash Speed</Label>
            <Row>
              {(['relaxed','normal','fast','blitz'] as FlashSpeed[]).map(s => (
                <button key={s} style={smBtn(flashSpeed===s)} onClick={() => setFlashSpeed(s)}>{s}</button>
              ))}
            </Row>
          </div>

          <button
            disabled={!opponentJoined}
            style={bigBtn(opponentJoined)}
            onClick={() => onStartGame({ gridSize, timeLimit, flashSpeed, gym, playerMode: 'remote' })}
          >
            Start Game
          </button>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13 }}>
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  }

  /* ── WAITING_OPPONENT (guest) ─────────────────────────────── */
  if (phase === 'WAITING_OPPONENT' && role === 'guest') {
    return (
      <div style={overlay}>
        <div style={card}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>🏀 Joined!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
            Room <span style={{ color: '#f5a623', fontWeight: 800 }}>{roomId}</span>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 8 }}>
            ⌛ Waiting for host to start the game…
          </div>
          <button onClick={onBack} style={{ marginTop: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13 }}>
            ← Leave Room
          </button>
        </div>
      </div>
    );
  }

  /* ── LOBBY ─────────────────────────────────────────────────── */
  return (
    <div style={overlay}>
      <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>🌐 Remote Play</div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>Play HORSE with a friend online</div>

      <div style={card}>
        {remoteError && (
          <div style={{ width: '100%', background: 'rgba(220,60,60,0.15)', border: '1px solid rgba(220,60,60,0.35)', borderRadius: 10, padding: '10px 14px', color: '#ff7b7b', fontSize: 13, textAlign: 'center' }}>
            {remoteError}
          </div>
        )}

        {mode === 'choose' && (
          <>
            <button style={bigBtn()} onClick={onCreateRoom}>Create Room</button>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>— or —</div>
            <button
              style={{ ...bigBtn(), background: 'rgba(255,255,255,0.08)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.15)' }}
              onClick={() => setMode('join')}
            >
              Join Room
            </button>
          </>
        )}

        {mode === 'join' && (
          <>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Enter the 6-letter room code:</div>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABCDEF"
              maxLength={6}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '14px', borderRadius: 12,
                border: '2px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.07)',
                color: '#fff', fontSize: 24, fontWeight: 800,
                textAlign: 'center', letterSpacing: '0.2em',
                outline: 'none',
              }}
              onKeyDown={(e) => e.key === 'Enter' && codeInput.length === 6 && onJoinRoom(codeInput)}
            />
            <button
              style={bigBtn(codeInput.length === 6)}
              disabled={codeInput.length !== 6}
              onClick={() => onJoinRoom(codeInput)}
            >
              Join Game
            </button>
            <button onClick={() => setMode('choose')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13 }}>
              ← Back
            </button>
          </>
        )}
      </div>

      <button onClick={onBack} style={{ marginTop: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13 }}>
        ← Back to Menu
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{children}</div>;
}

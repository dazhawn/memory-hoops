import { GamePhase, GridSize } from './types';

interface PatternGridProps {
  gridSize: GridSize;
  activeCell: number | null;
  playerInput: number[];
  pattern: number[];
  phase: GamePhase;
  onCellClick: (cellIndex: number) => void;
  // 2P setter mode
  setterInput?: number[];
  onSetterCellClick?: (cellIndex: number) => void;
  onConfirmSetter?: () => void;
  onClearSetter?: () => void;
  patternLength?: number;
}

const CELL_SIZES: Record<GridSize, number> = { 2: 110, 3: 88, 4: 70 };
const GAPS: Record<GridSize, number> = { 2: 10, 3: 8, 4: 6 };

export function PatternGrid({
  gridSize,
  activeCell,
  playerInput,
  pattern,
  phase,
  onCellClick,
  setterInput = [],
  onSetterCellClick,
  onConfirmSetter,
  onClearSetter,
  patternLength = 3,
}: PatternGridProps) {
  const totalCells = gridSize * gridSize;
  const cellSize = CELL_SIZES[gridSize];
  const gap = GAPS[gridSize];
  const isSetterMode = phase === 'SETTER_INPUT';
  const isPlayerTurn = phase === 'PLAYER_TURN';

  const getCellStyle = (index: number): React.CSSProperties => {
    if (isSetterMode) {
      const setterIdx = setterInput.indexOf(index);
      const isTapped = setterIdx !== -1;
      return {
        width: cellSize,
        height: cellSize,
        background: isTapped ? 'rgba(245,166,35,0.35)' : 'rgba(255,255,255,0.08)',
        border: isTapped ? '2px solid #f5a623' : '2px solid rgba(255,255,255,0.15)',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: isTapped ? 'scale(1.06)' : 'scale(1)',
        boxShadow: isTapped ? '0 0 18px 4px rgba(245,166,35,0.45)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        fontWeight: 900,
        color: isTapped ? '#f5a623' : 'rgba(255,255,255,0.15)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      };
    }

    const isActive = activeCell === index;
    const clickedIdx = playerInput.indexOf(index);
    const isClicked = clickedIdx !== -1;
    let background = 'rgba(255,255,255,0.12)';
    let boxShadow = 'none';
    let transform = 'scale(1)';

    if (isActive) {
      background = '#f5a623';
      boxShadow = `0 0 24px 8px rgba(245,166,35,0.7), 0 0 48px 16px rgba(245,166,35,0.3)`;
      transform = 'scale(1.06)';
    } else if (isClicked && isPlayerTurn) {
      background = 'rgba(255,200,80,0.35)';
      boxShadow = `0 0 12px 4px rgba(255,200,80,0.4)`;
    }

    return {
      width: cellSize,
      height: cellSize,
      background,
      border: isActive
        ? '2px solid #f5a623'
        : isClicked
          ? '2px solid rgba(255,200,80,0.6)'
          : '2px solid rgba(255,255,255,0.15)',
      borderRadius: 12,
      cursor: isPlayerTurn ? 'pointer' : 'default',
      transition: 'all 0.15s ease',
      transform,
      boxShadow,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 20,
      fontWeight: 700,
      color: isActive ? '#1a0f06' : 'rgba(255,255,255,0.3)',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    };
  };

  const getCellLabel = (index: number): string => {
    if (isSetterMode) {
      const idx = setterInput.indexOf(index);
      return idx !== -1 ? String(idx + 1) : '';
    }
    const clickedIdx = playerInput.indexOf(index);
    if (isPlayerTurn && clickedIdx !== -1) return String(clickedIdx + 1);
    return '';
  };

  const canConfirm = isSetterMode && setterInput.length >= patternLength;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '12%',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap,
      }}
    >
      {/* Phase label */}
      <div
        style={{
          textAlign: 'center',
          color: isSetterMode ? '#f5a623' : 'rgba(255,255,255,0.7)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {isSetterMode
          ? `Tap ${patternLength} cells in order (${setterInput.length}/${patternLength})`
          : phase === 'COMPUTER_SHOWS'
            ? 'Memorize the pattern'
            : 'Tap the pattern in order'}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
          gap,
        }}
      >
        {Array.from({ length: totalCells }, (_, i) => (
          <div
            key={i}
            style={getCellStyle(i)}
            onClick={() => isSetterMode ? onSetterCellClick?.(i) : onCellClick(i)}
          >
            {getCellLabel(i)}
          </div>
        ))}
      </div>

      {/* Setter controls */}
      {isSetterMode && (
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={onClearSetter}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.55)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ✕ Clear
          </button>
          <button
            onClick={canConfirm ? onConfirmSetter : undefined}
            style={{
              padding: '10px 28px',
              borderRadius: 10,
              border: `2px solid ${canConfirm ? '#f5a623' : 'rgba(245,166,35,0.2)'}`,
              background: canConfirm ? 'rgba(245,166,35,0.22)' : 'rgba(245,166,35,0.06)',
              color: canConfirm ? '#f5a623' : 'rgba(245,166,35,0.3)',
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '0.08em',
              cursor: canConfirm ? 'pointer' : 'default',
              transition: 'all 0.15s',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ✓ Set Pattern
          </button>
        </div>
      )}

      {/* Progress dots (player turn only) */}
      {isPlayerTurn && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
          {pattern.map((_, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: i < playerInput.length ? '#f5a623' : 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

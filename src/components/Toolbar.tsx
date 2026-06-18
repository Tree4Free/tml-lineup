import { DAYS, type Day, type Orientation } from '../types';

interface Props {
  day: Day;
  orient: Orientation;
  focus: boolean;
  clashCount: number;
  selCount: number;
  onDay: (d: Day) => void;
  onOrient: (o: Orientation) => void;
  onFocus: (f: boolean) => void;
  onToggleLineup: () => void;
}

export function Toolbar({
  day,
  orient,
  focus,
  clashCount,
  selCount,
  onDay,
  onOrient,
  onFocus,
  onToggleLineup,
}: Props) {
  return (
    <header className="toolbar">
      <span className="brand">
        <span className="brand__dot" />
        <strong className="brand__name">Tomorrowland 2026 W1</strong>
      </span>

      <div className="seg">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            className={`seg__btn ${d === day ? 'seg__btn--on' : ''}`}
            onClick={() => onDay(d)}
          >
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="toolbar__spacer" />

      <div className="seg">
        <button
          type="button"
          className={`seg__btn ${orient === 'h' ? 'seg__btn--on' : ''}`}
          onClick={() => onOrient('h')}
        >
          Horizontal
        </button>
        <button
          type="button"
          className={`seg__btn ${orient === 'v' ? 'seg__btn--on' : ''}`}
          onClick={() => onOrient('v')}
        >
          Vertical
        </button>
      </div>

      <button
        type="button"
        className={`chip ${focus ? 'chip--on' : ''}`}
        onClick={() => onFocus(!focus)}
      >
        Focus {focus ? 'on' : 'off'}
      </button>

      {clashCount > 0 && (
        <span className="chip chip--warn">
          {clashCount} clash{clashCount > 1 ? 'es' : ''}
        </span>
      )}

      <button
        type="button"
        className="btn btn--primary lineup-toggle"
        onClick={onToggleLineup}
      >
        Lineup · {selCount}
      </button>
    </header>
  );
}

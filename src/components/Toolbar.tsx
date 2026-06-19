import {
  DAYS,
  WEEKENDS,
  type Day,
  type Orientation,
  type Weekend,
} from '../types';
import { ThemeToggle } from './ThemeToggle';
import { SearchBox } from './SearchBox';
import { GitHubLink } from './GitHubLink';

interface Props {
  weekend: Weekend;
  day: Day;
  orient: Orientation;
  focus: boolean;
  clashCount: number;
  selCount: number;
  query: string;
  matchCount: number;
  matchDays: Set<Day>;
  onlyMyStages: boolean;
  onQuery: (q: string) => void;
  onWeekend: (w: Weekend) => void;
  onDay: (d: Day) => void;
  onOrient: (o: Orientation) => void;
  onFocus: (f: boolean) => void;
  onOnlyMyStages: (v: boolean) => void;
  onToggleLineup: () => void;
}

export function Toolbar({
  weekend,
  day,
  orient,
  focus,
  clashCount,
  selCount,
  query,
  matchCount,
  matchDays,
  onlyMyStages,
  onQuery,
  onWeekend,
  onDay,
  onOrient,
  onFocus,
  onOnlyMyStages,
  onToggleLineup,
}: Props) {
  return (
    <header className="toolbar">
      <span className="brand">
        <span className="brand__dot" />
        <strong className="brand__name">Tomorrowland 2026</strong>
      </span>

      <div className="seg" role="group" aria-label="Weekend">
        {WEEKENDS.map((w) => (
          <button
            key={w}
            type="button"
            className={`seg__btn ${w === weekend ? 'seg__btn--on' : ''}`}
            aria-pressed={w === weekend}
            onClick={() => onWeekend(w)}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="seg" role="group" aria-label="Day">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            className={`seg__btn ${d === day ? 'seg__btn--on' : ''}`}
            aria-pressed={d === day}
            onClick={() => onDay(d)}
          >
            {d.slice(0, 3)}
            {matchDays.has(d) && (
              <span className="tab-dot" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      <SearchBox query={query} matchCount={matchCount} onQuery={onQuery} />

      <div className="toolbar__spacer" />

      <div className="seg" role="group" aria-label="Orientation">
        <button
          type="button"
          className={`seg__btn ${orient === 'h' ? 'seg__btn--on' : ''}`}
          aria-pressed={orient === 'h'}
          aria-label="Horizontal"
          title="Horizontal"
          onClick={() => onOrient('h')}
        >
          <span className="seg__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M4 7h16M4 12h16M4 17h10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="seg__label">Horizontal</span>
        </button>
        <button
          type="button"
          className={`seg__btn ${orient === 'v' ? 'seg__btn--on' : ''}`}
          aria-pressed={orient === 'v'}
          aria-label="Vertical"
          title="Vertical"
          onClick={() => onOrient('v')}
        >
          <span className="seg__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M7 4v16M12 4v16M17 4v10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="seg__label">Vertical</span>
        </button>
      </div>

      <button
        type="button"
        className={`chip ${focus ? 'chip--on' : ''}`}
        aria-pressed={focus}
        onClick={() => onFocus(!focus)}
      >
        Focus {focus ? 'on' : 'off'}
      </button>

      <button
        type="button"
        className={`chip ${onlyMyStages ? 'chip--on' : ''}`}
        aria-pressed={onlyMyStages}
        title="Show only stages with a selected set"
        onClick={() => onOnlyMyStages(!onlyMyStages)}
      >
        My stages
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

      <ThemeToggle />

      <GitHubLink className="ghlink" />
    </header>
  );
}

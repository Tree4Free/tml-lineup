import { useEffect, useRef, useState } from 'react';

interface Props {
  query: string;
  matchCount: number;
  onQuery: (q: string) => void;
  onJumpNext: () => void;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="11"
        cy="11"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 21l-4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Search field that collapses to an icon button on phones (tap to expand) and
 * is always shown on wider screens. Collapsing also clears the query so there's
 * never a hidden active filter.
 */
export function SearchBox({ query, matchCount, onQuery, onJumpNext }: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const toggle = (): void => {
    if (open) {
      onQuery('');
      setOpen(false);
    } else {
      setOpen(true);
    }
  };

  return (
    <div className={`search ${open ? 'search--open' : ''}`}>
      <button
        type="button"
        className="search-toggle"
        aria-label={open ? 'Close search' : 'Search acts'}
        aria-expanded={open}
        onClick={toggle}
      >
        <SearchIcon />
      </button>

      <div className="search__field">
        <span className="search__icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="search"
          className="search__input"
          placeholder="Search acts…"
          aria-label="Search acts"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onJumpNext();
            }
          }}
        />
        {query !== '' && (
          <button
            type="button"
            className="search__count"
            disabled={matchCount === 0}
            title="Jump to next match on this day"
            aria-label={`${matchCount} matches on this day. Jump to the next.`}
            onClick={onJumpNext}
          >
            <span aria-live="polite">{matchCount}</span>
            <span className="search__count-arrow" aria-hidden="true">
              ↵
            </span>
          </button>
        )}
        {query !== '' && (
          <button
            type="button"
            className="search__clear"
            aria-label="Clear search"
            onClick={() => onQuery('')}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

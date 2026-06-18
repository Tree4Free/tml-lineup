import { useState } from 'react';
import { DAYS, type Day, type Performance } from '../types';
import { formatMinutes } from '../lib/time';

interface Props {
  open: boolean;
  byDaySelected: Record<Day, Performance[]>;
  clashes: Set<string>;
  notes: Record<string, string>;
  activeDay: Day;
  planNote: string;
  shareUrl: string;
  tooLong: boolean;
  onPlanNote: (text: string) => void;
  onRemove: (id: string) => void;
  onEditNote: (id: string) => void;
  onJump: (day: Day) => void;
  onClose: () => void;
}

export function Sidebar({
  open,
  byDaySelected,
  clashes,
  notes,
  activeDay,
  planNote,
  shareUrl,
  tooLong,
  onPlanNote,
  onRemove,
  onEditNote,
  onJump,
  onClose,
}: Props) {
  const [note, setNote] = useState(planNote);
  const [copied, setCopied] = useState(false);

  const total = DAYS.reduce((n, d) => n + byDaySelected[d].length, 0);
  const clashCount = clashes.size;

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard may be blocked; the field stays selectable as a fallback.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <div
        className={`scrim ${open ? 'scrim--on' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__head">
          <h2>My Lineup</h2>
          <span className="chip chip--accent">{total}</span>
          <div className="toolbar__spacer" />
          <button
            type="button"
            className="icon-btn sidebar__close"
            onClick={onClose}
            aria-label="Close lineup"
          >
            ×
          </button>
        </div>

        {clashCount > 0 && (
          <div className="banner banner--warn">
            {clashCount} clash{clashCount > 1 ? 'es' : ''} in your lineup
          </div>
        )}

        <div className="sidebar__list">
          {total === 0 && (
            <p className="empty">
              Tap a set in the grid to add it to your lineup.
            </p>
          )}

          {DAYS.map((day) =>
            byDaySelected[day].length === 0 ? null : (
              <section key={day} className="daygroup">
                <button
                  type="button"
                  className={`daygroup__title ${day === activeDay ? 'is-active' : ''}`}
                  onClick={() => onJump(day)}
                >
                  {day}
                  <span className="daygroup__count">
                    {byDaySelected[day].length}
                  </span>
                </button>

                {byDaySelected[day].map((p) => (
                  <div
                    key={p.id}
                    className={`li ${clashes.has(p.id) ? 'li--clash' : ''}`}
                  >
                    <span className="li__time">
                      {formatMinutes(p.startMin)}
                    </span>
                    <div className="li__main">
                      <strong className="li__name">{p.name}</strong>
                      <small className="li__stage">{p.stageName}</small>
                      {notes[p.id] && (
                        <span className="li__note">“{notes[p.id]}”</span>
                      )}
                    </div>
                    <div className="li__actions">
                      <button
                        type="button"
                        className="icon-btn"
                        title="Comment"
                        aria-label="Comment"
                        onClick={() => onEditNote(p.id)}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Remove"
                        aria-label="Remove"
                        onClick={() => onRemove(p.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            ),
          )}
        </div>

        <div className="sidebar__foot">
          <label className="field">
            <span className="muted small">Plan note</span>
            <textarea
              rows={2}
              value={note}
              placeholder="e.g. Meet at Cage entrance 15:00"
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => onPlanNote(note)}
            />
          </label>
          <div className="field">
            <span className="muted small">Shareable link</span>
            <div className="copy-row">
              <input className="url" readOnly value={shareUrl} />
              <button type="button" className="btn btn--primary" onClick={copy}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            {tooLong && (
              <span className="muted small warn-text">
                Very long link (~8k+ chars) — it still works, but some apps may
                truncate it.
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

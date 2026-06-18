import { useState } from 'react';
import {
  DAYS,
  WEEKENDS,
  type Day,
  type Performance,
  type Weekend,
} from '../types';
import { formatMinutes } from '../lib/time';

interface Props {
  open: boolean;
  weekend: Weekend;
  onWeekend: (w: Weekend) => void;
  name: string;
  byDaySelected: Record<Day, Performance[]>;
  clashes: Set<string>;
  notes: Record<string, string>;
  activeDay: Day;
  planNote: string;
  shareUrl: string;
  tooLong: boolean;
  onName: (name: string) => void;
  onPlanNote: (text: string) => void;
  onRemove: (id: string) => void;
  onEditNote: (id: string) => void;
  onJump: (day: Day) => void;
  onClose: () => void;
}

export function Sidebar({
  open,
  weekend,
  onWeekend,
  name,
  byDaySelected,
  clashes,
  notes,
  activeDay,
  planNote,
  shareUrl,
  tooLong,
  onName,
  onPlanNote,
  onRemove,
  onEditNote,
  onJump,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);

  const saveName = (): void => {
    setEditingName(false);
    onName(nameDraft.trim());
  };

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
        <div className="sidebar__weekends">
          {WEEKENDS.map((w) => (
            <button
              key={w}
              type="button"
              className={`wktab ${w === weekend ? 'wktab--on' : ''}`}
              onClick={() => onWeekend(w)}
            >
              Weekend {w.slice(1)}
            </button>
          ))}
        </div>

        <div className="sidebar__head">
          {editingName ? (
            <input
              className="lineup-name-input"
              autoFocus
              value={nameDraft}
              placeholder="My Lineup"
              maxLength={60}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
                else if (e.key === 'Escape') setEditingName(false);
              }}
            />
          ) : (
            <>
              <h2 className="lineup-name">{name || 'My Lineup'}</h2>
              <button
                type="button"
                className="icon-btn"
                title="Rename lineup"
                aria-label="Rename lineup"
                onClick={() => {
                  setNameDraft(name);
                  setEditingName(true);
                }}
              >
                ✎
              </button>
            </>
          )}
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
              value={planNote}
              placeholder="e.g. Meet at Cage entrance 15:00"
              onChange={(e) => onPlanNote(e.target.value)}
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

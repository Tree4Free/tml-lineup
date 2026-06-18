import { useState } from 'react';
import type { Performance } from '../types';
import { formatMinutes } from '../lib/time';

interface Props {
  perf: Performance;
  note: string;
  clashWith: Performance[];
  onNote: (text: string) => void;
  onClose: () => void;
}

/** Comment-only modal — selection happens by clicking the set in the grid. */
export function NoteModal({ perf, note, clashWith, onNote, onClose }: Props) {
  const [text, setText] = useState(note);

  const save = (): void => {
    onNote(text);
    onClose();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div>
            <strong>{perf.name}</strong>
            <div className="muted small">
              {perf.stageName} · {formatMinutes(perf.startMin)}–
              {formatMinutes(perf.endMin)} · {perf.day.slice(0, 3)}
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {clashWith.length > 0 && (
          <div className="banner banner--warn">
            Clashes with {clashWith.map((c) => c.name).join(', ')}
          </div>
        )}

        <label className="field">
          <span className="muted small">Comment (optional)</span>
          <textarea
            autoFocus
            rows={3}
            value={text}
            placeholder="Add a note for this set…"
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <div className="sheet__actions">
          <button type="button" className="btn btn--primary" onClick={save}>
            Save
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

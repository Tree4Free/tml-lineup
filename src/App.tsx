import { useMemo, useState } from 'react';
import './App.css';
import { byDay, performances as allPerfs } from './data/lineup';
import { findClashes } from './lib/conflicts';
import { encodeState, useUrlState } from './state/urlState';
import { DAYS, type Day, type Performance } from './types';
import { Toolbar } from './components/Toolbar';
import { Timetable } from './components/Timetable';
import { NoteModal } from './components/NoteModal';
import { Sidebar } from './components/Sidebar';

const byId = new Map(allPerfs.map((p) => [p.id, p]));
const emptyGroups = (): Record<Day, Performance[]> => ({
  FRIDAY: [],
  SATURDAY: [],
  SUNDAY: [],
});

export default function App() {
  const [state, setState] = useUrlState();
  const [noteId, setNoteId] = useState<string | null>(null);
  const [lineupOpen, setLineupOpen] = useState(false);

  const selected = useMemo(() => new Set(state.sel), [state.sel]);

  // Selected sets grouped by day (time-sorted) + the clash set across all days.
  const { byDaySelected, clashes } = useMemo(() => {
    const clash = new Set<string>();
    const grouped = emptyGroups();
    for (const day of DAYS) {
      const list = byDay[day]
        .filter((p) => selected.has(p.id))
        .sort((a, b) => a.startMin - b.startMin);
      grouped[day] = list;
      for (const id of findClashes(list)) clash.add(id);
    }
    return { byDaySelected: grouped, clashes: clash };
  }, [selected]);

  const dayClashCount = byDaySelected[state.day].filter((p) =>
    clashes.has(p.id),
  ).length;

  const toggle = (id: string): void => {
    if (selected.has(id)) {
      // Leaving the lineup also drops its comment — comments only exist for
      // sets you've selected.
      const notes = { ...state.notes };
      delete notes[id];
      setState({ ...state, sel: state.sel.filter((x) => x !== id), notes });
    } else {
      setState({ ...state, sel: [...state.sel, id] });
    }
  };

  const setNote = (id: string, text: string): void => {
    const notes = { ...state.notes };
    if (text.trim()) notes[id] = text;
    else delete notes[id];
    setState({ ...state, notes });
  };

  const notePerf = noteId ? byId.get(noteId) : undefined;
  const noteClashWith: Performance[] = notePerf
    ? byDaySelected[notePerf.day].filter(
        (p) =>
          p.id !== notePerf.id &&
          p.startMin < notePerf.endMin &&
          notePerf.startMin < p.endMin,
      )
    : [];

  const shareUrl =
    location.origin + location.pathname + '#s=' + encodeState(state);

  return (
    <div className="app">
      <Toolbar
        day={state.day}
        orient={state.orient}
        focus={state.focus}
        clashCount={dayClashCount}
        selCount={state.sel.length}
        onDay={(day) => setState({ ...state, day })}
        onOrient={(orient) => setState({ ...state, orient })}
        onFocus={(focus) => setState({ ...state, focus })}
        onToggleLineup={() => setLineupOpen((o) => !o)}
      />

      <div className="body">
        <Timetable
          day={state.day}
          orient={state.orient}
          performances={byDay[state.day]}
          selected={selected}
          clashes={clashes}
          notes={state.notes}
          focus={state.focus}
          onSelect={toggle}
        />

        <Sidebar
          open={lineupOpen}
          byDaySelected={byDaySelected}
          clashes={clashes}
          notes={state.notes}
          activeDay={state.day}
          planNote={state.planNote}
          shareUrl={shareUrl}
          tooLong={shareUrl.length > 8000}
          onPlanNote={(planNote) => setState({ ...state, planNote })}
          onRemove={toggle}
          onEditNote={setNoteId}
          onJump={(day) => setState({ ...state, day })}
          onClose={() => setLineupOpen(false)}
        />
      </div>

      {notePerf && (
        <NoteModal
          key={notePerf.id}
          perf={notePerf}
          note={state.notes[notePerf.id] ?? ''}
          clashWith={noteClashWith}
          onNote={(t) => setNote(notePerf.id, t)}
          onClose={() => setNoteId(null)}
        />
      )}
    </div>
  );
}

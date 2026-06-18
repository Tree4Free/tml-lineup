import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { findClashes } from './lib/conflicts';
import { useLineup } from './data/useLineup';
import { encodeState, useUrlState } from './state/urlState';
import { DAYS, type Day, type Performance, type WeekendPlan } from './types';
import { Toolbar } from './components/Toolbar';
import { Timetable } from './components/Timetable';
import { NoteModal } from './components/NoteModal';
import { Sidebar } from './components/Sidebar';

const emptyGroups = (): Record<Day, Performance[]> => ({
  FRIDAY: [],
  SATURDAY: [],
  SUNDAY: [],
});

export default function App() {
  const [state, setState] = useUrlState();
  const lineup = useLineup(state.weekend);
  const [openId, setOpenId] = useState<string | null>(null);
  const [lineupOpen, setLineupOpen] = useState(false);

  // Only treat data as ready when it's for the weekend currently selected — a
  // stale fetch from the previous weekend reads as "loading", which also keeps
  // the prune effect below from running against the wrong weekend's acts.
  const ready =
    lineup.status === 'ready' && lineup.weekend === state.weekend
      ? lineup.data
      : null;
  const errored =
    lineup.status === 'error' && lineup.weekend === state.weekend
      ? lineup.error
      : null;
  const plan = state.plans[state.weekend];
  const selected = useMemo(() => new Set(plan.sel), [plan.sel]);

  // Selected sets grouped by day (time-sorted) + clash set, scoped to the
  // loaded weekend's data (so picks from the other weekend never interfere).
  const { byDaySelected, clashes } = useMemo(() => {
    const grouped = emptyGroups();
    const clash = new Set<string>();
    if (ready) {
      for (const day of DAYS) {
        const list = ready.byDay[day]
          .filter((p) => selected.has(p.id))
          .sort((a, b) => a.startMin - b.startMin);
        grouped[day] = list;
        for (const id of findClashes(list)) clash.add(id);
      }
    }
    return { byDaySelected: grouped, clashes: clash };
  }, [ready, selected]);

  // Resilience: once a weekend's data is loaded, drop any picks/notes for acts
  // that are no longer in that lineup (other weekend's picks are left alone).
  useEffect(() => {
    if (!ready) return;
    const current = state.plans[state.weekend];
    const sel = current.sel.filter((id) => ready.byId.has(id));
    if (sel.length === current.sel.length) return;
    const notes: Record<string, string> = {};
    for (const id of sel) {
      if (current.notes[id] !== undefined) notes[id] = current.notes[id];
    }
    setState({
      ...state,
      plans: { ...state.plans, [state.weekend]: { ...current, sel, notes } },
    });
  }, [ready, state, setState]);

  const setPlan = (next: WeekendPlan): void => {
    setState({ ...state, plans: { ...state.plans, [state.weekend]: next } });
  };

  const toggle = (id: string): void => {
    if (selected.has(id)) {
      const notes = { ...plan.notes };
      delete notes[id]; // removing a set drops its comment
      setPlan({ ...plan, sel: plan.sel.filter((x) => x !== id), notes });
    } else {
      setPlan({ ...plan, sel: [...plan.sel, id] });
    }
  };

  const setNote = (id: string, text: string): void => {
    const notes = { ...plan.notes };
    if (text.trim()) notes[id] = text;
    else delete notes[id];
    setPlan({ ...plan, notes });
  };

  const dayClashCount = byDaySelected[state.day].filter((p) =>
    clashes.has(p.id),
  ).length;
  const selCount = DAYS.reduce((n, d) => n + byDaySelected[d].length, 0);

  const notePerf = ready && openId ? ready.byId.get(openId) : undefined;
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
        weekend={state.weekend}
        day={state.day}
        orient={state.orient}
        focus={state.focus}
        clashCount={dayClashCount}
        selCount={selCount}
        onWeekend={(weekend) => setState({ ...state, weekend })}
        onDay={(day) => setState({ ...state, day })}
        onOrient={(orient) => setState({ ...state, orient })}
        onFocus={(focus) => setState({ ...state, focus })}
        onToggleLineup={() => setLineupOpen((o) => !o)}
      />

      <div className="body">
        {ready ? (
          <Timetable
            layout={ready.dayLayout[state.day]}
            orient={state.orient}
            performances={ready.byDay[state.day]}
            selected={selected}
            clashes={clashes}
            notes={plan.notes}
            focus={state.focus}
            onSelect={toggle}
          />
        ) : (
          <div className="splash">
            {errored === null ? (
              <span className="muted">Loading the {state.weekend} lineup…</span>
            ) : (
              <>
                <span className="muted">
                  Couldn’t load the lineup — {errored}
                </span>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={lineup.reload}
                >
                  Retry
                </button>
              </>
            )}
          </div>
        )}

        <Sidebar
          key={state.weekend}
          open={lineupOpen}
          byDaySelected={byDaySelected}
          clashes={clashes}
          notes={plan.notes}
          activeDay={state.day}
          planNote={plan.planNote}
          shareUrl={shareUrl}
          tooLong={shareUrl.length > 8000}
          onPlanNote={(planNote) => setPlan({ ...plan, planNote })}
          onRemove={toggle}
          onEditNote={setOpenId}
          onJump={(day) => setState({ ...state, day })}
          onClose={() => setLineupOpen(false)}
        />
      </div>

      {notePerf && (
        <NoteModal
          key={notePerf.id}
          perf={notePerf}
          note={plan.notes[notePerf.id] ?? ''}
          clashWith={noteClashWith}
          onNote={(t) => setNote(notePerf.id, t)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

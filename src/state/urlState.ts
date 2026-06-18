import { useCallback, useEffect, useState } from 'react';
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';
import {
  DAYS,
  WEEKENDS,
  type Day,
  type Orientation,
  type ShareState,
  type Weekend,
  type WeekendPlan,
} from '../types';

const emptyPlan = (): WeekendPlan => ({ sel: [], notes: {}, planNote: '' });

export const DEFAULT_STATE: ShareState = {
  v: 2,
  weekend: 'W1',
  day: 'FRIDAY',
  orient: 'h',
  focus: false,
  plans: { W1: emptyPlan(), W2: emptyPlan() },
};

function planHasContent(p: WeekendPlan): boolean {
  return (
    p.sel.length > 0 ||
    Object.keys(p.notes).length > 0 ||
    p.planNote.trim() !== ''
  );
}

// There's only something worth putting in the URL once the user has built a
// plan — picks, a per-set note, or a plan note, in either weekend. View-only
// prefs (weekend, day, orientation, focus) don't dirty the URL on their own.
function isShareable(s: ShareState): boolean {
  return WEEKENDS.some((w) => planHasContent(s.plans[w]));
}

export function encodeState(s: ShareState): string {
  return compressToEncodedURIComponent(JSON.stringify(s));
}

function isStringRecord(v: unknown): v is Record<string, string> {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    Object.values(v).every((x) => typeof x === 'string')
  );
}

function migratePlan(value: unknown): WeekendPlan {
  if (typeof value !== 'object' || value === null) return emptyPlan();
  const p = value as Partial<WeekendPlan>;
  return {
    sel: Array.isArray(p.sel)
      ? p.sel.filter((x): x is string => typeof x === 'string')
      : [],
    notes: isStringRecord(p.notes) ? p.notes : {},
    planNote: typeof p.planNote === 'string' ? p.planNote : '',
  };
}

// Validate shape, fill defaults, and bring older versions forward. A v1 link was
// a single (W1) plan with flat sel/notes/planNote; fold it into plans.W1.
function migrate(parsed: unknown): ShareState {
  if (typeof parsed !== 'object' || parsed === null) return DEFAULT_STATE;
  const p = parsed as Record<string, unknown>;
  const day = DAYS.includes(p.day as Day) ? (p.day as Day) : DEFAULT_STATE.day;
  const orient: Orientation = p.orient === 'v' ? 'v' : 'h';
  const focus = Boolean(p.focus);

  if (p.v === 2) {
    const plans = (p.plans ?? {}) as Record<string, unknown>;
    return {
      v: 2,
      weekend: WEEKENDS.includes(p.weekend as Weekend)
        ? (p.weekend as Weekend)
        : 'W1',
      day,
      orient,
      focus,
      plans: { W1: migratePlan(plans.W1), W2: migratePlan(plans.W2) },
    };
  }

  // Legacy v1 (or unknown): treat the flat fields as the W1 plan.
  return {
    v: 2,
    weekend: 'W1',
    day,
    orient,
    focus,
    plans: { W1: migratePlan(parsed), W2: emptyPlan() },
  };
}

export function decodeState(hash: string): ShareState {
  const raw = hash.replace(/^#s=/, '');
  if (!raw) return DEFAULT_STATE;
  try {
    const json = decompressFromEncodedURIComponent(raw);
    return migrate(json ? JSON.parse(json) : null);
  } catch {
    return DEFAULT_STATE; // unreadable/foreign hash → clean default view
  }
}

function initialState(): ShareState {
  if (location.hash) return decodeState(location.hash);
  // No shared link yet: phones default to the vertical layout (the wide grid
  // can't fit a narrow screen).
  const narrow =
    typeof window !== 'undefined' && window.innerWidth < 640 ? 'v' : 'h';
  return { ...DEFAULT_STATE, orient: narrow };
}

export function useUrlState(): [ShareState, (next: ShareState) => void] {
  const [state, setState] = useState<ShareState>(initialState);

  useEffect(() => {
    const onHash = () => setState(decodeState(location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const update = useCallback((next: ShareState) => {
    const url = isShareable(next)
      ? '#s=' + encodeState(next)
      : location.pathname + location.search; // clean URL until there's a plan
    history.replaceState(null, '', url);
    setState(next);
  }, []);

  return [state, update];
}

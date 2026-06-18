import { useEffect, useState } from 'react';
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';
import { DAYS, type Day, type Orientation, type ShareState } from '../types';

export const DEFAULT_STATE: ShareState = {
  v: 1,
  day: 'SATURDAY',
  orient: 'h',
  focus: false,
  sel: [],
  notes: {},
  planNote: '',
};

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

// Validate shape, fill defaults, and bump older versions. Today only v:1 exists;
// this is the seam that lets a future v:2 reshape old links rather than dropping
// a shared plan.
function migrate(parsed: unknown): ShareState {
  if (typeof parsed !== 'object' || parsed === null) return DEFAULT_STATE;
  const p = parsed as Partial<ShareState>;
  return {
    v: 1,
    day: DAYS.includes(p.day as Day) ? (p.day as Day) : DEFAULT_STATE.day,
    orient: (p.orient === 'v' ? 'v' : 'h') as Orientation,
    focus: Boolean(p.focus),
    sel: Array.isArray(p.sel)
      ? p.sel.filter((x): x is string => typeof x === 'string')
      : [],
    notes: isStringRecord(p.notes) ? p.notes : {},
    planNote: typeof p.planNote === 'string' ? p.planNote : '',
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
  const update = (next: ShareState): void => {
    history.replaceState(null, '', '#s=' + encodeState(next));
    setState(next);
  };
  return [state, update];
}

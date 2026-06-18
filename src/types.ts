export const DAYS = ['FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
export type Day = (typeof DAYS)[number];

export const WEEKENDS = ['W1', 'W2'] as const;
export type Weekend = (typeof WEEKENDS)[number];

export type Orientation = 'h' | 'v';

export interface Artist {
  id: string;
  name: string;
}

export interface Stage {
  id: string;
  name: string;
  /** Stable global ordering index, shared across days. */
  index: number;
}

export interface Performance {
  id: string;
  name: string;
  stageId: string;
  stageName: string;
  day: Day;
  /** The authoritative date bucket (YYYY-MM-DD), e.g. an overnight set keeps its start date. */
  date: string;
  /** Minutes from midnight of `date`; an overnight end exceeds 1440. */
  startMin: number;
  endMin: number;
  /** Sub-lane within the stage band, for the rare same-stage overlap. */
  lane: number;
  artists: Artist[];
}

/** A user's picks for one weekend. */
export interface WeekendPlan {
  /** Selected performance ids. */
  sel: string[];
  /** performanceId -> note (only kept for selected, present acts). */
  notes: Record<string, string>;
  /** One free-text note for the whole weekend. */
  planNote: string;
}

/** The complete, shareable view — the single source of truth, encoded into the URL hash. */
export interface ShareState {
  v: 2;
  /** Which weekend's lineup is loaded. */
  weekend: Weekend;
  day: Day;
  orient: Orientation;
  /** Hide unselected sets when true. */
  focus: boolean;
  /** Picks/notes kept separately per weekend (W1 and W2 share no act ids). */
  plans: Record<Weekend, WeekendPlan>;
}

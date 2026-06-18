export const DAYS = ['FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
export type Day = (typeof DAYS)[number];

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

/** The complete, shareable view — the single source of truth, encoded into the URL hash. */
export interface ShareState {
  v: 1;
  day: Day;
  orient: Orientation;
  /** Hide unselected sets when true. */
  focus: boolean;
  /** Selected performance ids (span all days). */
  sel: string[];
  /** performanceId -> note. */
  notes: Record<string, string>;
  /** One free-text note for the whole plan. */
  planNote: string;
}

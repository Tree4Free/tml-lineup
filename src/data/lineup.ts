import stagesJson from './stages.json';
import {
  DAYS,
  type Day,
  type Performance,
  type Stage,
  type Weekend,
} from '../types';
import { toMinutes } from '../lib/time';

export const LINEUP_URLS: Record<Weekend, string> = {
  W1: 'https://artist-lineup-cdn.tomorrowland.com/TL26BE-W1-9205196e-3eef-45c0-a82e-72aa1bb3cf8f.json',
  W2: 'https://artist-lineup-cdn.tomorrowland.com/TL26BE-W2-9205196e-3eef-45c0-a82e-72aa1bb3cf8f.json',
};

interface RawPerformance {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  stage: { id: string; name: string };
  date: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface DayLayout {
  stages: { stage: Stage; laneCount: number }[];
  startMin: number;
  endMin: number;
}

export interface LineupData {
  performances: Performance[];
  byId: Map<string, Performance>;
  stages: Stage[];
  byDay: Record<Day, Performance[]>;
  dayLayout: Record<Day, DayLayout>;
}

// Both the `day` and `date` fields in the data are unreliable, so the festival
// night is derived purely from the start timestamp: take the start's calendar
// date, shifted back one day when the set begins before the early-morning cutoff
// (a 00:00 set is the tail of the previous night, not the start of a new day).
// The three distinct festival dates map, in order, to FRIDAY/SATURDAY/SUNDAY.
const NIGHT_CUTOFF_MIN = 6 * 60;
function festivalDate(startTime: string): string {
  const startOfDay =
    Number(startTime.slice(11, 13)) * 60 + Number(startTime.slice(14, 16));
  const date = startTime.slice(0, 10);
  if (startOfDay >= NIGHT_CUTOFF_MIN) return date;
  return new Date(Date.parse(date) - 86_400_000).toISOString().slice(0, 10);
}

const laneKey = (day: Day, stageId: string): string => `${day}|${stageId}`;

// Canonical stage order, taken from the festival's published stage list.
const canonicalOrder = new Map<string, number>(
  stagesJson.stages.map((s, i) => [s.id, i]),
);

/** Normalize raw performances into the derived structures the UI renders from. */
export function buildLineup(rawPerformances: RawPerformance[]): LineupData {
  const datesSorted = [
    ...new Set(rawPerformances.map((p) => festivalDate(p.startTime))),
  ].sort();
  const dateToDay = new Map<string, Day>(
    datesSorted.map((date, i) => [date, DAYS[i] ?? DAYS[DAYS.length - 1]]),
  );

  // Unique stages present, ordered by the canonical list (unknown stages last).
  const stageSeen = new Map<string, { id: string; name: string }>();
  for (const p of rawPerformances) {
    if (!stageSeen.has(p.stage.id)) {
      stageSeen.set(p.stage.id, { id: p.stage.id, name: p.stage.name });
    }
  }
  const stages: Stage[] = [...stageSeen.values()]
    .sort(
      (a, b) =>
        (canonicalOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (canonicalOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    )
    .map((s, i) => ({ id: s.id, name: s.name, index: i }));

  const all: Performance[] = rawPerformances.map((p) => {
    const fdate = festivalDate(p.startTime);
    return {
      id: p.id,
      name: p.name,
      stageId: p.stage.id,
      stageName: p.stage.name,
      day: dateToDay.get(fdate) ?? DAYS[0],
      date: fdate,
      startMin: toMinutes(p.startTime, fdate),
      endMin: toMinutes(p.endTime, fdate),
      lane: 0,
      artists: p.artists,
    };
  });

  // Greedy interval partitioning per (day, stage): the rare same-stage overlap
  // gets its own sub-lane instead of colliding.
  const laneCountByKey = new Map<string, number>();
  const groups = new Map<string, Performance[]>();
  for (const perf of all) {
    const key = laneKey(perf.day, perf.stageId);
    const list = groups.get(key);
    if (list) list.push(perf);
    else groups.set(key, [perf]);
  }
  for (const [key, list] of groups) {
    list.sort((a, b) => a.startMin - b.startMin);
    const laneEnds: number[] = [];
    for (const perf of list) {
      let lane = laneEnds.findIndex((end) => end <= perf.startMin);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(perf.endMin);
      } else {
        laneEnds[lane] = perf.endMin;
      }
      perf.lane = lane;
    }
    laneCountByKey.set(key, laneEnds.length);
  }

  const byDay = { FRIDAY: [], SATURDAY: [], SUNDAY: [] } as Record<
    Day,
    Performance[]
  >;
  const dayLayout = {} as Record<Day, DayLayout>;
  for (const day of DAYS) {
    const list = all.filter((p) => p.day === day);
    byDay[day] = list;
    const present = stages.filter((s) => list.some((p) => p.stageId === s.id));
    dayLayout[day] = {
      stages: present.map((stage) => ({
        stage,
        laneCount: laneCountByKey.get(laneKey(day, stage.id)) ?? 1,
      })),
      startMin: list.length ? Math.min(...list.map((p) => p.startMin)) : 0,
      endMin: list.length ? Math.max(...list.map((p) => p.endMin)) : 0,
    };
  }

  return {
    performances: all,
    byId: new Map(all.map((p) => [p.id, p])),
    stages,
    byDay,
    dayLayout,
  };
}

/** Fetch a weekend's lineup JSON from the CDN at runtime and build derived data. */
export async function fetchLineup(
  weekend: Weekend,
  signal?: AbortSignal,
): Promise<LineupData> {
  const res = await fetch(LINEUP_URLS[weekend], { signal });
  if (!res.ok) {
    throw new Error(`Lineup request failed (HTTP ${res.status})`);
  }
  const json: unknown = await res.json();
  const performances = (json as { performances?: unknown }).performances;
  if (!Array.isArray(performances)) {
    throw new Error('Unexpected lineup format: missing "performances" array');
  }
  return buildLineup(performances as RawPerformance[]);
}

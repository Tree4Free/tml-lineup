import rawJson from './lineup.json';
import stagesJson from './stages.json';
import { DAYS, type Day, type Performance, type Stage } from '../types';
import { toMinutes } from '../lib/time';

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

const raw = rawJson as unknown as { performances: RawPerformance[] };

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

const datesSorted = [
  ...new Set(raw.performances.map((p) => festivalDate(p.startTime))),
].sort();
const dateToDay = new Map<string, Day>(
  datesSorted.map((date, i) => [date, DAYS[i] ?? DAYS[DAYS.length - 1]]),
);

const laneKey = (day: Day, stageId: string): string => `${day}|${stageId}`;

// Canonical stage order, taken from the festival's published stage list.
const canonicalOrder = new Map<string, number>(
  stagesJson.stages.map((s, i) => [s.id, i]),
);

// Unique stages present in the lineup, ordered by the canonical list (any stage
// not in that list falls to the end, keeping first-appearance order).
const stageSeen = new Map<string, { id: string; name: string }>();
for (const p of raw.performances) {
  if (!stageSeen.has(p.stage.id)) {
    stageSeen.set(p.stage.id, { id: p.stage.id, name: p.stage.name });
  }
}

export const stages: Stage[] = [...stageSeen.values()]
  .sort(
    (a, b) =>
      (canonicalOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (canonicalOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  )
  .map((s, i) => ({ id: s.id, name: s.name, index: i }));

const all: Performance[] = raw.performances.map((p) => {
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

export const performances: Performance[] = all;

export interface DayLayout {
  stages: { stage: Stage; laneCount: number }[];
  startMin: number;
  endMin: number;
}

export const byDay = {} as Record<Day, Performance[]>;
export const dayLayout = {} as Record<Day, DayLayout>;

for (const day of DAYS) {
  const list = all.filter((p) => p.day === day);
  byDay[day] = list;
  const present = stages.filter((s) => list.some((p) => p.stageId === s.id));
  dayLayout[day] = {
    stages: present.map((stage) => ({
      stage,
      laneCount: laneCountByKey.get(laneKey(day, stage.id)) ?? 1,
    })),
    startMin: Math.min(...list.map((p) => p.startMin)),
    endMin: Math.max(...list.map((p) => p.endMin)),
  };
}

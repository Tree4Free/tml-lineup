import type { Performance } from '../types';

/**
 * Returns the ids of selected sets that overlap at least one other selected
 * set. Pass only the selected sets for ONE day bucket — offsets are day-local,
 * and sets on different days can't clash. Overlap is half-open: a set ending at
 * exactly the minute another begins does not count.
 */
export function findClashes(daySelected: Performance[]): Set<string> {
  const sorted = [...daySelected].sort((a, b) => a.startMin - b.startMin);
  const clashing = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      // Sorted by start: once j starts at/after i ends, no later set overlaps i.
      if (sorted[j].startMin >= sorted[i].endMin) break;
      clashing.add(sorted[i].id);
      clashing.add(sorted[j].id);
    }
  }
  return clashing;
}

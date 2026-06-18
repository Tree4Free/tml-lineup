import type { CSSProperties } from 'react';
import type { DayLayout } from '../data/lineup';
import { formatMinutes } from '../lib/time';
import type { Orientation, Performance } from '../types';
import { PerformanceBlock } from './PerformanceBlock';

const PX_PER_MIN_H = 3.1;
const PX_PER_MIN_V = 2.1;
const ROW_H = 56; // horizontal: one stage sub-lane is this tall (fits name + time)
const COL_W = 152; // vertical: one stage sub-lane is this wide
const TIME_HEADER = 32; // top header thickness
const STAGE_LABEL = 132; // horizontal left-header (stage names) width
const TIME_LABEL = 56; // vertical left-header (time ruler) width

interface Props {
  layout: DayLayout;
  orient: Orientation;
  performances: Performance[];
  selected: Set<string>;
  clashes: Set<string>;
  notes: Record<string, string>;
  focus: boolean;
  onSelect: (id: string) => void;
}

export function Timetable({
  layout,
  orient,
  performances,
  selected,
  clashes,
  notes,
  focus,
  onSelect,
}: Props) {
  const isH = orient === 'h';
  // Axis runs from the day's first set start to its last set end (both bucketed
  // by the date field), with 30 min of padding on each side so the first/last
  // blocks aren't flush against the edge.
  const AXIS_PAD = 30;
  const axisStart = layout.startMin - AXIS_PAD;
  const axisEnd = layout.endMin + AXIS_PAD;
  const totalMin = axisEnd - axisStart;
  const laneUnit = isH ? ROW_H : COL_W;
  const timePx = isH ? PX_PER_MIN_H : PX_PER_MIN_V;

  const stageOffset = new Map<string, number>();
  let acc = 0;
  for (const { stage, laneCount } of layout.stages) {
    stageOffset.set(stage.id, acc);
    acc += laneCount * laneUnit;
  }
  const crossTotal = acc;
  const timeTotal = totalMin * timePx;

  const plotW = isH ? timeTotal : crossTotal;
  const plotH = isH ? crossTotal : timeTotal;
  const leftW = isH ? STAGE_LABEL : TIME_LABEL;

  const hours: number[] = [];
  const firstHour = Math.ceil(axisStart / 60) * 60;
  const lastHour = Math.floor(axisEnd / 60) * 60;
  for (let t = firstHour; t <= lastHour; t += 60) hours.push(t);

  const visible = focus
    ? performances.filter((p) => selected.has(p.id))
    : performances;

  const gridStyle: CSSProperties = {
    gridTemplateColumns: `${leftW}px ${plotW}px`,
    gridTemplateRows: `${TIME_HEADER}px ${plotH}px`,
  };

  return (
    <div className={`tt tt--${orient}`} style={gridStyle}>
      <div className="tt__corner" />

      <div className="tt__top">
        {isH
          ? hours.map((t) => (
              <span
                key={t}
                className="tt__time"
                style={{ left: (t - axisStart) * timePx }}
              >
                {formatMinutes(t)}
              </span>
            ))
          : layout.stages.map(({ stage, laneCount }) => (
              <span
                key={stage.id}
                className="tt__stage tt__stage--top"
                style={{
                  left: stageOffset.get(stage.id),
                  width: laneCount * laneUnit,
                }}
              >
                {stage.name}
              </span>
            ))}
      </div>

      <div className="tt__left">
        {isH
          ? layout.stages.map(({ stage, laneCount }) => (
              <span
                key={stage.id}
                className="tt__stage tt__stage--left"
                style={{
                  top: stageOffset.get(stage.id),
                  height: laneCount * laneUnit,
                }}
              >
                {stage.name}
              </span>
            ))
          : hours.map((t) => (
              <span
                key={t}
                className="tt__time tt__time--left"
                style={{ top: (t - axisStart) * timePx }}
              >
                {formatMinutes(t)}
              </span>
            ))}
      </div>

      <div className="tt__plot">
        {hours.map((t) => (
          <div
            key={t}
            className="tt__grid"
            style={
              isH
                ? { left: (t - axisStart) * timePx }
                : { top: (t - axisStart) * timePx }
            }
          />
        ))}
        {visible.map((perf) => {
          const timePos = (perf.startMin - axisStart) * timePx;
          const timeSize = Math.max(
            (perf.endMin - perf.startMin) * timePx - 2,
            24,
          );
          const crossPos =
            (stageOffset.get(perf.stageId) ?? 0) + perf.lane * laneUnit;
          const crossSize = laneUnit - 3;
          const style: CSSProperties = isH
            ? {
                left: timePos,
                width: timeSize,
                top: crossPos + 1,
                height: crossSize,
              }
            : {
                top: timePos,
                height: timeSize,
                left: crossPos + 1,
                width: crossSize,
              };
          return (
            <PerformanceBlock
              key={perf.id}
              perf={perf}
              style={style}
              selected={selected.has(perf.id)}
              clash={clashes.has(perf.id)}
              hasNote={Boolean(notes[perf.id])}
              onClick={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

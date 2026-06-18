import type { CSSProperties } from 'react';
import type { Performance } from '../types';
import { formatMinutes } from '../lib/time';

interface Props {
  perf: Performance;
  style: CSSProperties;
  selected: boolean;
  clash: boolean;
  hasNote: boolean;
  onClick: (id: string) => void;
}

export function PerformanceBlock({
  perf,
  style,
  selected,
  clash,
  hasNote,
  onClick,
}: Props) {
  const cls = ['block'];
  if (selected) cls.push('block--sel');
  if (clash) cls.push('block--clash');
  const time = `${formatMinutes(perf.startMin)}–${formatMinutes(perf.endMin)}`;
  return (
    <button
      type="button"
      className={cls.join(' ')}
      style={style}
      title={`${perf.name} · ${perf.stageName} · ${time}`}
      onClick={() => onClick(perf.id)}
    >
      <span className="block__top">
        <span className="block__name">{perf.name}</span>
        {hasNote && (
          <span className="block__note" aria-label="has note">
            ✎
          </span>
        )}
      </span>
      <span className="block__time">{time}</span>
    </button>
  );
}

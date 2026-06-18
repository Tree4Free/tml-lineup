import { useEffect, useState } from 'react';
import type { Weekend } from '../types';
import { fetchLineup, type LineupData } from './lineup';

export type LineupState =
  | { status: 'loading' }
  | { status: 'error'; weekend: Weekend; error: string }
  | { status: 'ready'; weekend: Weekend; data: LineupData };

/** Fetches the given weekend's lineup at runtime; refetches when the weekend changes. */
export function useLineup(
  weekend: Weekend,
): LineupState & { reload: () => void } {
  const [state, setState] = useState<LineupState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    // State is set only from the async callbacks; until one resolves, a weekend
    // mismatch between `state` and the requested `weekend` reads as "loading".
    fetchLineup(weekend, ctrl.signal)
      .then((data) => setState({ status: 'ready', weekend, data }))
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({
          status: 'error',
          weekend,
          error: err instanceof Error ? err.message : 'Failed to load lineup',
        });
      });
    return () => ctrl.abort();
  }, [weekend, nonce]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}

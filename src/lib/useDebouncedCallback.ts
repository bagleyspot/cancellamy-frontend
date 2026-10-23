import { useCallback, useEffect, useRef } from 'react';

/** Returns a stable function that runs `callback` after `delay` ms of silence. Cancelled on unmount. */
export function useDebouncedCallback<Args extends unknown[]>(callback: (...args: Args) => void, delay: number) {
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return useCallback(
    (...args: Args) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => latest.current(...args), delay);
    },
    [delay],
  );
}

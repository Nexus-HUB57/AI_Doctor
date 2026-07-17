import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTRPCQueryState<T> {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
}

interface UseTRPCQueryOptions {
  enabled?: boolean;
}

/**
 * Generic tRPC query hook with AbortController cleanup and enabled flag.
 * Properly typed — avoids `any` defaults.
 */
export function useTRPCQuery<TResult>(
  queryFn: (signal?: AbortSignal) => Promise<TResult>,
  deps: React.DependencyList = [],
  options: UseTRPCQueryOptions = {}
) {
  const { enabled = true } = options;
  const [state, setState] = useState<UseTRPCQueryState<TResult>>({
    data: undefined,
    isLoading: enabled,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    // Abort previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await queryFn(controller.signal);
      if (!controller.signal.aborted) {
        setState({ data: result, isLoading: false, error: null });
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return; // Ignore aborted requests
      if (!controller.signal.aborted) {
        const message = (err as Error)?.message || 'Erro ao carregar dados';
        setState({ data: undefined, isLoading: false, error: message });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (enabled) {
      refetch();
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [refetch, enabled]);

  return { ...state, refetch };
}
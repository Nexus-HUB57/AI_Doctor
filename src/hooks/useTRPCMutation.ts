import { useState, useCallback, useRef } from 'react';

interface UseTRPCMutationState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Generic tRPC mutation hook with AbortController cleanup.
 * Properly typed — avoids `any` defaults.
 */
export function useTRPCMutation<TArgs, TResult>() {
  const [state, setState] = useState<UseTRPCMutationState<TResult>>({
    data: null,
    isLoading: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (
    mutationFn: (args: TArgs, signal?: AbortSignal) => Promise<TResult>,
    args: TArgs
  ): Promise<TResult | null> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ data: null, isLoading: true, error: null });
    try {
      const result = await mutationFn(args, controller.signal);
      if (!controller.signal.aborted) {
        setState({ data: result, isLoading: false, error: null });
      }
      return result;
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return null;
      if (!controller.signal.aborted) {
        const message = (err as Error)?.message || 'Erro inesperado ao processar requisição';
        setState({ data: null, isLoading: false, error: message });
      }
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
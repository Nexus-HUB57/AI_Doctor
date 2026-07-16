import { useState, useEffect, useCallback } from 'react';

interface UseTRPCQueryState<T> {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
}

export function useTRPCQuery<TResult = any>(
  queryFn: () => Promise<TResult>,
  deps: any[] = []
) {
  const [state, setState] = useState<UseTRPCQueryState<TResult>>({
    data: undefined,
    isLoading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await queryFn();
      setState({ data: result, isLoading: false, error: null });
    } catch (err: any) {
      const message = err?.message || 'Erro ao carregar dados';
      setState({ data: undefined, isLoading: false, error: message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
import { useState, useCallback } from 'react';

interface UseTRPCMutationState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useTRPCMutation<TArgs = any, TResult = any>() {
  const [state, setState] = useState<UseTRPCMutationState<TResult>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async (
    mutationFn: (args: TArgs) => Promise<TResult>,
    args: TArgs
  ): Promise<TResult | null> => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const result = await mutationFn(args);
      setState({ data: result, isLoading: false, error: null });
      return result;
    } catch (err: any) {
      const message = err?.message || 'Erro inesperado ao processar requisição';
      setState({ data: null, isLoading: false, error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
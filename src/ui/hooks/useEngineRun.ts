import { useCallback, useEffect, useRef, useState } from 'react';
import type { EngineRunResult } from '../../domain/types';
import { EngineWorkerClient } from '../../worker/worker-client';

export type RunPhase = 'idle' | 'processing' | 'done';

export interface EngineRunState {
  phase: RunPhase;
  result: EngineRunResult | null;
}

export function useEngineRun() {
  const clientRef = useRef<EngineWorkerClient | null>(null);
  const activeRequestId = useRef<string | null>(null);
  const [state, setState] = useState<EngineRunState>({ phase: 'idle', result: null });

  useEffect(() => {
    clientRef.current = new EngineWorkerClient();
    return () => {
      clientRef.current?.dispose();
      clientRef.current = null;
    };
  }, []);

  const run = useCallback((input: unknown) => {
    const client = clientRef.current;
    if (!client) return;
    setState({ phase: 'processing', result: null });
    const { requestId, promise } = client.run(input);
    activeRequestId.current = requestId;
    promise.then((result) => {
      if (activeRequestId.current !== requestId) return;
      setState({ phase: 'done', result });
    });
  }, []);

  const cancel = useCallback(() => {
    const client = clientRef.current;
    const requestId = activeRequestId.current;
    if (!client || !requestId) return;
    client.cancel(requestId);
  }, []);

  const reset = useCallback(() => {
    activeRequestId.current = null;
    setState({ phase: 'idle', result: null });
  }, []);

  return { phase: state.phase, result: state.result, run, cancel, reset };
}

import { useState, useRef, useCallback } from 'react';
import { MessageStatusStep, ResearchPayload } from '../types';
import { parseSSEBuffer, simplifyErrorMessage } from '../utils/sse';
import { fetchResearchStream } from '../utils/api';

export function useSSE() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusSteps, setStatusSteps] = useState<MessageStatusStep[]>([]);
  const [result, setResult] = useState<ResearchPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setStatusSteps([]);
    setResult(null);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedSteps: MessageStatusStep[] = [];
    let finalResult: ResearchPayload | null = null;
    let finalError: string | null = null;

    try {
      const response = await fetchResearchStream(query, controller.signal);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Server response does not support streaming.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, remainingBuffer } = parseSSEBuffer(buffer);
        buffer = remainingBuffer;

        for (const event of events) {
          if (event.type === 'status' && event.message) {
            const exists = accumulatedSteps.some((step) => step.message === event.message);
            if (!exists) {
              // Complete previous steps
              accumulatedSteps = accumulatedSteps.map((step) => ({
                ...step,
                status: 'completed' as const,
              }));
              // Add new pending step
              accumulatedSteps.push({
                message: event.message!,
                timestamp: new Date().toLocaleTimeString(),
                status: 'pending' as const,
              });
              setStatusSteps([...accumulatedSteps]);
            }
          } else if (event.type === 'result' && event.payload) {
            finalResult = event.payload;
            setResult(finalResult);
            // Complete all status steps
            accumulatedSteps = accumulatedSteps.map((step) => ({
              ...step,
              status: 'completed' as const,
            }));
            setStatusSteps([...accumulatedSteps]);
          } else if (event.type === 'error') {
            throw new Error(event.message || 'An error occurred during streaming.');
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        finalError = 'Stream stopped by user';
      } else {
        console.error('SSE stream error:', err);
        const rawError = err.message || 'Failed to establish connection.';
        finalError = simplifyErrorMessage(rawError);
        setError(finalError);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }

    return {
      result: finalResult,
      statusSteps: accumulatedSteps,
      error: finalError,
    };
  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    statusSteps,
    result,
    error,
    startStream,
    stopStream,
  };
}

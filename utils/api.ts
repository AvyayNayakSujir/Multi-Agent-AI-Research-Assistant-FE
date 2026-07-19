/**
 * API Service for Deep Research stream requests.
 */
export async function fetchResearchStream(query: string, signal?: AbortSignal): Promise<Response> {
  const response = await fetch('/api/v1/research/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    signal,
  });
  return response;
}

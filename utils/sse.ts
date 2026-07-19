export interface ParsedSSEEvent {
  type: 'status' | 'result' | 'error';
  message?: string;
  payload?: {
    query: string;
    draft: string;
    approved: boolean;
    iterations_used: number;
    sources: { url: string; title: string }[];
  };
}

export function parseSSEBuffer(
  buffer: string
): { events: ParsedSSEEvent[]; remainingBuffer: string } {
  const lines = buffer.split('\n');
  const remainingBuffer = lines.pop() || '';
  const events: ParsedSSEEvent[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('data:')) {
      const dataStr = trimmed.slice(5).trim();
      try {
        const parsed = JSON.parse(dataStr);
        events.push(parsed);
      } catch (err) {
        console.error('Error parsing SSE JSON:', dataStr, err);
      }
    }
  }

  return { events, remainingBuffer };
}

/**
 * Simplifies raw backend rate limits and execution errors into clean, user-friendly messages.
 */
export function simplifyErrorMessage(errorMsg: string): string {
  if (!errorMsg) return 'An unexpected error occurred. Please try again.';

  // Match Groq/Railway rate limits (TPD, TPM, RPM exceeded)
  if (
    errorMsg.includes('rate_limit_exceeded') || 
    errorMsg.includes('Rate limit reached') || 
    errorMsg.includes('Limit exceeded')
  ) {
    const isDaily = errorMsg.includes('tokens per day') || errorMsg.includes('TPD') || errorMsg.includes('daily');
    const limitType = isDaily ? 'Daily quota limit' : 'Rate limit';

    const timeMatch = errorMsg.match(/try again in ([\w\.]+s)/i);
    const modelMatch = errorMsg.match(/model `([^`]+)`/i);
    
    let timeText = 'a few minutes';
    if (timeMatch && timeMatch[1]) {
      const rawTime = timeMatch[1];
      const minutesMatch = rawTime.match(/(\d+)m/);
      const secondsMatch = rawTime.match(/(\d+)(?:\.\d+)?s/);
      
      const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
      const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;
      
      const parts = [];
      if (minutes > 0) {
        parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
      }
      if (seconds > 0) {
        parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
      }
      
      if (parts.length > 0) {
        timeText = parts.join(' and ');
      }
    }
    
    const modelText = modelMatch && modelMatch[1] ? ` for ${modelMatch[1]}` : '';
    return `${limitType} has been reached for making LLM calls${modelText}. Please try again in ${timeText}.`;
  }

  // Parse HTTP error status codes (e.g. "Server returned HTTP 429")
  if (errorMsg.includes('Server returned HTTP')) {
    const codeMatch = errorMsg.match(/HTTP (\d+)/);
    const code = codeMatch ? codeMatch[1] : '';
    if (code === '401' || code === '403') {
      return 'Authentication failed. Please verify the server API key configurations.';
    }
    if (code === '429') {
      return 'Daily quota limit has been reached for making LLM calls today. Please wait a moment before trying again.';
    }
    if (code === '500' || code === '502' || code === '503' || code === '504') {
      return 'The research server encountered an internal issue (HTTP ' + code + '). Please try again in a few moments.';
    }
  }

  // Network connection failures
  if (
    errorMsg.toLowerCase().includes('failed to fetch') || 
    errorMsg.toLowerCase().includes('network error') || 
    errorMsg.toLowerCase().includes('connection refused')
  ) {
    return 'Unable to establish a connection with the research server. Please check your network and verify if the backend service is online.';
  }

  // Fallback for long messages
  return errorMsg.length > 150 ? errorMsg.substring(0, 150) + '...' : errorMsg;
}

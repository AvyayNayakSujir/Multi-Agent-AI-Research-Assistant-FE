export interface Source {
  url: string;
  title: string;
}

export interface ResearchPayload {
  query: string;
  draft: string;
  approved: boolean;
  iterations_used: number;
  sources: Source[];
}

export type MessageRole = 'user' | 'assistant';

export interface MessageStatusStep {
  message: string;
  timestamp: string;
  status: 'pending' | 'completed';
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string; // User prompt or Assistant final draft
  statusSteps?: MessageStatusStep[];
  sources?: Source[];
  isLoading?: boolean;
  error?: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

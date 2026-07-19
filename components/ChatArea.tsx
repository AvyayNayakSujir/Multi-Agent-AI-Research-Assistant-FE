import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, MessageStatusStep } from '../types';
import { MessageItem } from './MessageItem';
import { ArrowUp, StopCircle, CornerDownLeft, Sparkles } from 'lucide-react';

interface ChatAreaProps {
  activeSession: ChatSession | null;
  onSendMessage: (content: string) => void;
  onStopStream: () => void;
  isGenerating: boolean;
  currentStreamSteps: MessageStatusStep[];
  currentStreamError: string | null;
}

export function ChatArea({
  activeSession,
  onSendMessage,
  onStopStream,
  isGenerating,
  currentStreamSteps,
  currentStreamError,
}: ChatAreaProps) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Why was IPv6 introduced?',
    'Explain async programming in Python.',
    'Compare Git rebase vs git merge.',
  ];

  // Auto-grow input text area
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  // Auto-scroll to bottom on messages/steps update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, currentStreamSteps, isGenerating]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onSendMessage(prompt.trim());
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-white text-zinc-900 dark:bg-black dark:text-zinc-50 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none dark:bg-indigo-500/5" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none dark:bg-purple-500/5" />

      {/* Chat Area Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-100 bg-white/80 px-6 backdrop-blur-md dark:border-zinc-900/60 dark:bg-black/80 z-10 select-none">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {activeSession ? activeSession.title : 'Workspace'}
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {isGenerating ? 'Running research agent...' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin z-10">
        {!activeSession || activeSession.messages.length === 0 ? (
          /* Landing State */
          <div className="flex h-full flex-col items-center justify-center text-center max-w-xl mx-auto animate-fadeIn">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-650 dark:bg-indigo-500/20 dark:text-indigo-400 mb-6">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mb-2">
              Multi-Agent Research Assistant
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              Enter any query to search, scrape, retrieve, and synthesize comprehensive reports with real-time process monitoring.
            </p>

            <div className="grid grid-cols-1 gap-3 w-full">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(suggestion);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 hover:border-indigo-500 hover:shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:border-indigo-450 dark:hover:bg-zinc-900/50 text-sm font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message Thread */
          <div className="max-w-3xl mx-auto">
            {activeSession.messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}

            {/* Real-time Loading Output */}
            {isGenerating && (
              <MessageItem
                message={{
                  id: 'temp-stream',
                  role: 'assistant',
                  content: '',
                  isLoading: true,
                  statusSteps: currentStreamSteps,
                  error: currentStreamError || undefined,
                  timestamp: Date.now(),
                }}
              />
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Message Input Box */}
      <div className="border-t border-zinc-100 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md dark:border-zinc-900/60 z-10 select-none">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-2 dark:bg-zinc-900/30 dark:border-zinc-800 transition-all duration-200">
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder="Ask anything..."
            className="flex-1 resize-none bg-transparent border-0 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-0 dark:text-zinc-100 placeholder-zinc-500 max-h-[200px] leading-relaxed"
          />

          <div className="flex items-center gap-1.5 pr-1">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopStream}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all duration-200 cursor-pointer"
                title="Stop generation"
              >
                <StopCircle className="h-4 w-4 animate-pulse" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!prompt.trim()}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                  prompt.trim()
                    ? 'bg-[#09090B] text-white shadow-md shadow-indigo-600/20'
                    : 'bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-700 pointer-events-none'
                }`}
                title="Submit search"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
        <div className="max-w-3xl mx-auto mt-2 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-650 px-3">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-2.5 w-2.5" />
            Secure SSE Connection
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, MessageStatusStep } from '../types';
import { MessageItem } from './MessageItem';
import { ArrowUp, StopCircle, CornerDownLeft, Sparkles, PanelLeftClose, PanelLeft } from 'lucide-react';

interface ChatAreaProps {
  activeSession: ChatSession | null;
  onSendMessage: (content: string) => void;
  onStopStream: () => void;
  isGenerating: boolean;
  currentStreamSteps: MessageStatusStep[];
  currentStreamError: string | null;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatArea({
  activeSession,
  onSendMessage,
  onStopStream,
  isGenerating,
  currentStreamSteps,
  currentStreamError,
  isSidebarOpen,
  onToggleSidebar,
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
      <div className="flex h-14 items-center justify-between border-b border-zinc-100 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-900/60 dark:bg-black/80 z-10 select-none">
        <div className="flex items-center gap-2 min-w-0 max-w-[calc(100vw-80px)]">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white transition-all cursor-pointer shrink-0"
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose className="h-4.5 w-4.5" /> : <PanelLeft className="h-4.5 w-4.5" />}
          </button>

          <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-[300px] md:max-w-[500px]">
            <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 leading-tight truncate">
              {activeSession ? activeSession.title : 'Workspace'}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5 truncate">
              {isGenerating ? 'Running research agent...' : 'Idle'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 scrollbar-thin z-10">
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

            {/* Suggestions list */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-lg mb-6">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSendMessage(suggestion)}
                  className="p-4 text-left text-xs bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-2xl dark:bg-zinc-900/25 dark:border-zinc-800 dark:hover:bg-zinc-900/60 dark:hover:border-zinc-700 transition-all cursor-pointer leading-relaxed text-zinc-600 dark:text-zinc-400"
                >
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">
                    Suggestion
                  </span>
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Stream List */
          <div className="max-w-3xl mx-auto space-y-6">
            {activeSession.messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}

            {/* Active Streaming steps */}
            {isGenerating && (
              <MessageItem
                message={{
                  id: 'streaming-active',
                  role: 'assistant',
                  content: '',
                  statusSteps: currentStreamSteps,
                  isLoading: true,
                  timestamp: Date.now(),
                }}
              />
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Message Input Box */}
      <div className="border-t border-transparent pb-4 pr-4 pl-4 bg-transparent dark:bg-transparent dark:border-transparent z-10 select-none">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-2 dark:bg-zinc-900/30 dark:border-zinc-800 transition-all duration-200">
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search and research anything..."
            className="flex-1 max-h-48 resize-none bg-transparent py-2.5 pl-3 pr-10 text-sm placeholder-zinc-400 focus:outline-none dark:placeholder-zinc-500 scrollbar-none leading-relaxed text-zinc-900 dark:text-zinc-100"
          />

          <div className="flex items-center gap-1.5 shrink-0 self-center">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopStream}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                title="Stop research stream"
              >
                <StopCircle className="h-4.5 w-4.5 animate-pulse" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!prompt.trim()}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${prompt.trim()
                    ? 'bg-[#09090B] text-white shadow-md shadow-indigo-600/20 dark:bg-[#FAFAFA] dark:text-black'
                    : 'bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-700 pointer-events-none'
                  }`}
                title="Submit search"
              >
                <ArrowUp className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
          <div className="absolute right-14 bottom-4 text-[9px] text-zinc-400 dark:text-zinc-650 hidden md:flex items-center gap-1">
            <span className="border border-zinc-250 dark:border-zinc-800 px-1 rounded">Enter</span>
            <span>to search</span>
            <CornerDownLeft className="h-2 w-2 ml-0.5" />
          </div>
        </form>
      </div>
    </div>
  );
}

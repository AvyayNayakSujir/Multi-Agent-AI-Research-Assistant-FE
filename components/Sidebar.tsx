import React, { useState, useEffect } from 'react';
import { ChatSession } from '../types';
import { Plus, Trash2, Sun, Moon, Sparkles } from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onClearAll,
}: SidebarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [confirmClear, setConfirmClear] = useState(false);

  // Initialize theme
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setTheme(isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleClearClick = () => {
    if (confirmClear) {
      onClearAll();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      // Auto-reset after 3 seconds if not clicked again
      const timer = setTimeout(() => setConfirmClear(false), 3000);
      return () => clearTimeout(timer);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-200 bg-zinc-950 text-zinc-200 dark:border-zinc-900 select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-start px-4 py-5 border-b border-zinc-900/60">
        <Sparkles className="h-4 w-4 mr-2 text-indigo-400" />
        <div className="font-semibold tracking-tight text-white text-base">Multi-Agent Research</div>
      </div>

      {/* Action Button */}
      <div className="px-3 pt-4">
        <button
          onClick={onCreateSession}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800/80 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 hover:border-zinc-700 active:bg-zinc-900 active:border-zinc-800 transition-all duration-200 group cursor-pointer"
        >
          <Plus className="h-4 w-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
          <span>New Research</span>
        </button>
      </div>

      {/* Session History List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-thin">
        <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
          Recent Searches
        </h3>
        {sessions.length === 0 ? (
          <div className="px-3 py-4 text-xs text-zinc-600 italic">No search history</div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white font-medium shadow-inner'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <span className="truncate flex-1 pr-2">{session.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className={`hover:text-rose-450 text-zinc-500 p-0.5 rounded transition-all cursor-pointer ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Delete session"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer controls */}
      <div className="border-t border-zinc-900 p-3 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-1 gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {sessions.length > 0 && (
            <button
              onClick={handleClearClick}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                confirmClear
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-500 hover:bg-rose-950/20 hover:text-rose-400'
              }`}
              title={confirmClear ? "Click again to confirm clear" : "Clear all history"}
            >
              <Trash2 className="h-4 w-4" />
              {confirmClear && <span className="animate-fadeIn">Confirm Clear?</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

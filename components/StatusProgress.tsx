import React, { useState } from 'react';
import { MessageStatusStep } from '../types';
import { Loader2, CheckCircle2, Circle, ChevronDown, ChevronUp, AlertCircle, XCircle } from 'lucide-react';

interface StatusProgressProps {
  steps: MessageStatusStep[];
  isLoading: boolean;
  error?: string | null;
}

export function StatusProgress({ steps, isLoading, error }: StatusProgressProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (steps.length === 0) return null;

  const currentStep = steps[steps.length - 1];

  return (
    <div className={`my-4 rounded-xl border p-4 transition-all ${
      error 
        ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20' 
        : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500 dark:text-indigo-400" />
          ) : error ? (
            <XCircle className="h-4 w-4 text-rose-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
          <span className={`text-sm font-semibold ${
            error 
              ? 'text-rose-700 dark:text-rose-400' 
              : 'text-zinc-700 dark:text-zinc-300'
          }`}>
            {isLoading 
              ? (currentStep?.message || 'Researching...') 
              : error 
              ? 'Research incomplete' 
              : 'Research complete'}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
          aria-label={isOpen ? 'Collapse logs' : 'Expand logs'}
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 space-y-2.5 border-t border-zinc-200/60 pt-3 dark:border-zinc-800/60">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const isCompleted = step.status === 'completed';
            const isFailed = isLast && !!error;

            return (
              <div key={idx} className="flex items-start gap-3 text-sm animate-fadeIn">
                <div className="mt-0.5">
                  {isFailed ? (
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  ) : isLast && isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500 shrink-0" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm leading-relaxed ${
                      isFailed
                        ? 'font-medium text-rose-600 dark:text-rose-400'
                        : isCompleted
                        ? 'text-zinc-400 dark:text-zinc-500 line-through decoration-zinc-200/40 dark:decoration-zinc-800/40'
                        : 'font-medium text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {step.message}
                  </p>
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">
                  {step.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

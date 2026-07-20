import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../types';
import { StatusProgress } from './StatusProgress';
import { copyToClipboard, downloadAsMarkdown, downloadPDF } from '../utils/download';
import { Copy, Check, Download, FileText, Globe } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const markdownRef = useRef<HTMLDivElement>(null);

  const isUser = message.role === 'user';

  const handleCopyPrompt = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleCopyResponse = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    const filename = `research-${message.id}`;
    downloadAsMarkdown(filename, message.content);
  };

  const handleDownloadPDF = () => {
    const filename = `research-${message.id}`;
    downloadPDF(filename, message.content);
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 animate-fadeIn">
        <div className="max-w-[85%] rounded-2xl bg-zinc-100 px-4 py-3 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50 relative group shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed pr-6">{message.content}</p>
          <button
            onClick={handleCopyPrompt}
            className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all cursor-pointer"
            title="Copy prompt"
          >
            {copiedPrompt ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 border-b border-zinc-100 pb-6 dark:border-zinc-800/40 animate-fadeIn">
      {/* SSE Status logs */}
      {message.statusSteps && message.statusSteps.length > 0 && (
        <StatusProgress steps={message.statusSteps} isLoading={!!message.isLoading} error={message.error} />
      )}

      {/* Main Content Area */}
      {message.content && (
        <div className="prose prose-zinc max-w-none dark:prose-invert">
          <div
            ref={markdownRef}
            className="markdown-body text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 prose-headings:font-semibold prose-headings:text-zinc-950 dark:prose-headings:text-zinc-50 prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-table:border-collapse prose-th:bg-zinc-50 dark:prose-th:bg-zinc-900/50"
          >
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto w-full my-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <table {...props} className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800" />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th {...props} className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 text-left text-xs font-semibold text-zinc-950 dark:text-zinc-50 border-b border-zinc-200 dark:border-zinc-800" />
                ),
                td: ({ node, ...props }) => (
                  <td {...props} className="px-4 py-2 text-xs text-zinc-850 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800/40" />
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Sources list */}
      {message.sources && message.sources.length > 0 && (
        <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800/40">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Sources Cited
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {message.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col p-3 rounded-xl border border-zinc-200 bg-white hover:border-indigo-500 hover:shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:border-indigo-400"
              >
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1 mb-1">
                  {source.title}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                  {getDomain(source.url)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {message.error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 text-sm">
          {message.error}
        </div>
      )}

      {/* Actions toolbar */}
      {!message.isLoading && message.content && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleCopyResponse}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            {copiedResponse ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy response</span>
              </>
            )}
          </button>
          <span className="text-zinc-200 dark:text-zinc-800">|</span>
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download MD</span>
          </button>
          <span className="text-zinc-200 dark:text-zinc-800">|</span>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { ChatSession, ChatMessage } from '../types';
import { useSSE } from '../hooks/useSSE';

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    isLoading,
    statusSteps,
    error,
    startStream,
    stopStream,
  } = useSSE();

  // Load from localStorage on mount
  useEffect(() => {
    const storedSessions = localStorage.getItem('research_sessions');

    if (storedSessions) {
      try {
        const parsed = JSON.parse(storedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse sessions from localStorage', e);
      }
    }
  }, []);

  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('research_sessions', JSON.stringify(updatedSessions));
  };

  const handleCreateSession = () => {
    // Return to the clean landing workspace (deselect current active session).
    // A session is only instantiated in history after a prompt is sent.
    setActiveSessionId(null);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleClearAll = () => {
    saveSessions([]);
    setActiveSessionId(null);
  };

  const handleSendMessage = async (query: string) => {
    if (isLoading) return;

    let currentSessionId = activeSessionId;
    let currentSessions = [...sessions];

    // 1. Create a session on-the-fly if none exists
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        title: query.length > 30 ? `${query.slice(0, 30)}...` : query,
        messages: [],
        createdAt: Date.now(),
      };
      currentSessions = [newSession, ...currentSessions];
      currentSessionId = newSession.id;
      setActiveSessionId(newSession.id);
    }

    const activeSessionIndex = currentSessions.findIndex((s) => s.id === currentSessionId);
    if (activeSessionIndex === -1) return;

    const session = currentSessions[activeSessionIndex];

    // 2. Add User Prompt Message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    const updatedTitle = session.title === 'New Research'
      ? (query.length > 30 ? `${query.slice(0, 30)}...` : query)
      : session.title;

    currentSessions[activeSessionIndex] = {
      ...session,
      title: updatedTitle,
      messages: [...session.messages, userMessage],
    };
    
    // Save to trigger immediate render of user message
    saveSessions(currentSessions);

    // 2. Stream Response from backend
    const streamOutput = await startStream(query);

    // Retrieve fresh session state to handle potential modifications in-between
    const freshSessions = [...currentSessions];
    const freshSessionIndex = freshSessions.findIndex((s) => s.id === currentSessionId);
    if (freshSessionIndex === -1) return;

    // 3. Append completed Assistant Response Message
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: streamOutput.result?.draft || '',
      sources: streamOutput.result?.sources || [],
      statusSteps: streamOutput.statusSteps,
      error: streamOutput.error || undefined,
      isLoading: false,
      timestamp: Date.now(),
    };

    freshSessions[freshSessionIndex] = {
      ...freshSessions[freshSessionIndex],
      messages: [...freshSessions[freshSessionIndex].messages, assistantMessage],
    };

    saveSessions(freshSessions);
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-black font-sans">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
        isOpen={isSidebarOpen}
      />
      <ChatArea
        activeSession={activeSession}
        onSendMessage={handleSendMessage}
        onStopStream={stopStream}
        isGenerating={isLoading}
        currentStreamSteps={statusSteps}
        currentStreamError={error}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
    </div>
  );
}

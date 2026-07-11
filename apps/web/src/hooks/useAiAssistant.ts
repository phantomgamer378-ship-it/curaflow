"use client";

import { useState, useCallback } from "react";
import type { AIResponse } from "@/lib/api/ai";

interface UseAiAssistantOptions {
  apiFn: (message: string, threadId?: string) => Promise<AIResponse>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function useAiAssistant({ apiFn }: UseAiAssistantOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | undefined>();

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFn(text, threadId);
      if (res.ok && res.data) {
        setThreadId(res.data.thread_id);
        const aiMsg: Message = {
          role: "assistant",
          content: typeof res.data.response === "string" ? res.data.response : JSON.stringify(res.data.response),
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setError(res.error || "Something went wrong.");
      }
    } catch (e: any) {
      setError(e.message || "Network error.");
    } finally {
      setIsLoading(false);
    }
  }, [apiFn, threadId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setThreadId(undefined);
    setError(null);
  }, []);

  return { messages, isLoading, error, threadId, sendMessage, clearChat };
}

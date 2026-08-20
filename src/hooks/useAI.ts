"use client";

import { useState, useCallback } from "react";
import { api } from "@/services/api-client";

interface AIResponse {
  id: string;
  content: string;
  confidence?: number;
  sources?: string[];
  timestamp: Date;
}

interface UseAIState {
  response: AIResponse | null;
  loading: boolean;
  error: string | null;
  isStreaming: boolean;
}

interface UseAIReturn extends UseAIState {
  generate: (prompt: string, context?: Record<string, unknown>) => Promise<AIResponse | null>;
  stream: (prompt: string, onChunk: (chunk: string) => void) => Promise<void>;
  clear: () => void;
}

export function useAI(): UseAIReturn {
  const [state, setState] = useState<UseAIState>({
    response: null,
    loading: false,
    error: null,
    isStreaming: false,
  });

  const generate = useCallback(async (prompt: string, context?: Record<string, unknown>): Promise<AIResponse | null> => {
    setState({ response: null, loading: true, error: null, isStreaming: false });

    try {
      const res = await api.post<AIResponse>("/api/v1/ai/generate", {
        prompt,
        context,
      });

      if (res.success && res.data) {
        setState({
          response: res.data,
          loading: false,
          error: null,
          isStreaming: false,
        });
        return res.data;
      } else {
        const errorMsg = res.error?.message || "Failed to generate AI response";
        setState({
          response: null,
          loading: false,
          error: errorMsg,
          isStreaming: false,
        });
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "AI generation failed";
      setState({
        response: null,
        loading: false,
        error: errorMsg,
        isStreaming: false,
      });
      return null;
    }
  }, []);

  const stream = useCallback(async (prompt: string, onChunk: (chunk: string) => void) => {
    setState({ response: null, loading: true, error: null, isStreaming: true });

    try {
      const response = await fetch("/api/v1/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        onChunk(chunk);
      }

      setState({
        response: {
          id: `ai-${Date.now()}`,
          content: fullContent,
          timestamp: new Date(),
        },
        loading: false,
        error: null,
        isStreaming: false,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Streaming failed";
      setState({
        response: null,
        loading: false,
        error: errorMsg,
        isStreaming: false,
      });
    }
  }, []);

  const clear = useCallback(() => {
    setState({ response: null, loading: false, error: null, isStreaming: false });
  }, []);

  return {
    ...state,
    generate,
    stream,
    clear,
  };
}

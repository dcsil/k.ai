"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/components/AuthContext";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function AIChatbot() {
  const { getAccessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function fetchUserContext() {
    try {
      const token = getAccessToken();
      if (!token) return;

      // Fetch releases
      const releasesRes = await fetch("/api/releases", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let contextText = "";

      if (releasesRes.ok) {
        const releasesData = await releasesRes.json();
        const releases = releasesData.items || [];

        if (releases.length > 0) {
          contextText += "User's Releases:\n";
          for (const release of releases) {
            contextText += `- ${release.name} (Status: ${release.status}, Target Date: ${release.targetReleaseDate || "Not set"})\n`;

            // Fetch tasks for each release
            const tasksRes = await fetch(
              `/api/releases/${release.id}/tasks`,
              { 
                credentials: "include",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (tasksRes.ok) {
              const tasksData = await tasksRes.json();
              const tasks = tasksData.items || [];
              if (tasks.length > 0) {
                contextText += `  Tasks:\n`;
                tasks.forEach((task: { title: string; status: string }) => {
                  contextText += `    - ${task.title} (${task.status})\n`;
                });
              }
            }
          }
        }
      }

      setContext(contextText);
    } catch (error) {
      console.error("Failed to fetch context:", error);
    }
  }

  // Fetch user context (tasks + releases) on mount
  useEffect(() => {
    fetchUserContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoscroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Build context-aware prompt
      const contextPrompt = context
        ? `Here is the user's current music release information:\n\n${context}\n\nUser question: ${userMessage.content}`
        : userMessage.content;

      const token = getAccessToken();

      const res = await fetch("/api/genai", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
         },
        body: JSON.stringify({ prompt: contextPrompt }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text || "Sorry, I couldn't generate a response.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${(error as Error).message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Ask me anything about your music releases
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                How can I help you today?
              </h3>
              <p className="text-muted-foreground mb-6">
                I have access to your releases and tasks. Ask me about planning,
                marketing strategies, or anything related to your music career.
              </p>
              <div className="space-y-2">
                <SuggestedPrompt
                  text="What should I focus on for my upcoming release?"
                  onClick={() =>
                    setInput("What should I focus on for my upcoming release?")
                  }
                />
                <SuggestedPrompt
                  text="Help me create a marketing plan"
                  onClick={() => setInput("Help me create a marketing plan")}
                />
                <SuggestedPrompt
                  text="What tasks am I missing?"
                  onClick={() => setInput("What tasks am I missing?")}
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {loading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-6 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your music release..."
            className="flex-1 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex gap-3 max-w-[80%]">
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
            U
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-3 max-w-[80%]">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="rounded-lg px-4 py-3 bg-card border border-border">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
            <div
              className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestedPrompt({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 text-sm text-left border border-border rounded-lg hover:bg-accent transition-colors"
    >
      {text}
    </button>
  );
}
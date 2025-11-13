"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AIChatbot() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/genai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResponse(data.text ?? JSON.stringify(data));
    } catch (err) {
      setResponse(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">AI Chat</h3>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full p-2 border border-border rounded mb-2 min-h-[80px]"
        placeholder="Ask the AI anything about your release."
      />
      <div className="flex gap-2">
        <button
          onClick={send}
          disabled={loading}
          className="px-3 py-2 bg-primary text-primary-foreground rounded-md"
        >
          {loading ? "Sending..." : "Send"}
        </button>
        <button
          onClick={() => { setPrompt(""); setResponse(null); }}
          className="px-3 py-2 border border-border rounded-md"
          type="button"
        >
          Clear
        </button>
      </div>

      {response && (
        <div className="mt-4 bg-background p-3 border border-border rounded text-sm prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

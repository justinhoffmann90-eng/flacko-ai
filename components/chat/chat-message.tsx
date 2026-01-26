"use client";

import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, timestamp, isLoading }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isLoading ? (
          <div className="flex space-x-1 py-2">
            <div className="h-2 w-2 bg-current rounded-full animate-bounce opacity-60" />
            <div className="h-2 w-2 bg-current rounded-full animate-bounce opacity-60 [animation-delay:0.1s]" />
            <div className="h-2 w-2 bg-current rounded-full animate-bounce opacity-60 [animation-delay:0.2s]" />
          </div>
        ) : (
          <div className={cn("prose prose-sm max-w-none", isUser ? "prose-invert" : "prose-invert")}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                code: ({ children }) => (
                  <code className="bg-black/20 px-1 py-0.5 rounded text-xs">{children}</code>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
        {timestamp && (
          <p className={cn("text-xs mt-1 opacity-60", isUser ? "text-right" : "text-left")}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}

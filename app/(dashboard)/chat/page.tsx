"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/dashboard/header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatWelcome } from "@/components/chat/chat-welcome";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState(15);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch initial usage
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch("/api/chat/usage");
        const data = await res.json();
        setRemainingMessages(15 - (data.count || 0));
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      }
    };
    fetchUsage();
  }, []);

  const handleSend = async (input: string) => {
    if (loading || remainingMessages <= 0) return;

    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    // Build history for API (exclude timestamps, only include role and content)
    const history = updatedMessages.slice(0, -1).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history }),
      });

      const data = await res.json();

      const responseTimestamp = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `I apologize, but I encountered an error: ${data.error}`,
            timestamp: responseTimestamp,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: data.response,
            timestamp: responseTimestamp,
          },
        ]);
        setRemainingMessages((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <Header title="AI Chat" showNotifications={false} />
      <main className="flex flex-col flex-1 max-w-lg mx-auto w-full overflow-hidden">
        {/* Usage indicator - fixed height, no scroll */}
        <div className="shrink-0 px-4 py-2 border-b flex items-center justify-center gap-2 bg-background">
          <Badge variant={remainingMessages > 5 ? "secondary" : remainingMessages > 0 ? "yellow" : "red"}>
            {remainingMessages}/15
          </Badge>
          <span className="text-sm text-muted-foreground">
            messages remaining today
          </span>
        </div>

        {/* Messages - scrollable area */}
        <div 
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          style={{ 
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {messages.length === 0 && (
            <ChatWelcome onSuggestionClick={handleSuggestionClick} />
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}

          {loading && (
            <ChatMessage role="assistant" content="" isLoading />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input - fixed at bottom above nav */}
        <div className="shrink-0 px-4 py-3 border-t bg-background safe-area-bottom">
          <ChatInput
            onSend={handleSend}
            disabled={loading || remainingMessages <= 0}
            placeholder={
              remainingMessages > 0
                ? "Ask about today's report..."
                : "Daily limit reached. Resets at midnight ET."
            }
          />
        </div>
      </main>
    </div>
  );
}

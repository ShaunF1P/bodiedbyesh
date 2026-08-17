"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Send, X, Loader2, ArrowRight } from "lucide-react";

interface ChatMessage {
  id: string;
  client_id: string;
  sender: "client" | "coach";
  message: string;
  created_at: string;
}

interface ChatWidgetProps {
  clientId: string;
}

export default function ChatWidget({ clientId }: ChatWidgetProps) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch message history on mount/open
  useEffect(() => {
    if (!isOpen || !clientId) return;

    async function fetchHistory() {
      setFetching(true);
      try {
        const res = await fetch("/api/chat");
        const json = await res.json();
        if (json.success) {
          setMessages(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
      setFetching(false);
    }

    fetchHistory();
  }, [isOpen, clientId]);

  // Subscribe to real-time message changes
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`chat_messages:client_id=eq.${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Prevent duplicates from local optimistic insert
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, supabase]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !clientId) return;

    const text = input.trim();
    setInput("");
    setLoading(true);

    // Optimistic local UI insert
    const tempId = Math.random().toString();
    const tempMsg: ChatMessage = {
      id: tempId,
      client_id: clientId,
      sender: "client",
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        // Replace temp optimistic message with actual db message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? json.data : m))
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[calc(1.5rem+var(--sab))] right-[calc(1.5rem+var(--sar))] z-40 bg-accent-lime text-cyber-slate hover:bg-accent-lime/90 p-4 rounded-full shadow-2xl transition-all hover:scale-105 duration-200 cursor-pointer flex items-center justify-center border border-accent-lime/20"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-[calc(1.5rem+var(--sab))] right-[calc(1.5rem+var(--sar))] z-50 w-80 sm:w-96 h-[500px] glass-panel border border-white/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden bg-cyber-slate/95 backdrop-blur-md animate-fadeIn">
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-[#080A0E] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-accent-lime animate-pulse" />
              <div>
                <h3 className="text-xs font-bold font-display uppercase tracking-wider text-ice-white">
                  Coach Esh Chat
                </h3>
                <p className="text-[9px] text-silver-slate uppercase">Direct biofeedback portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-silver-slate hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#080A0E]/30">
            {fetching ? (
              <div className="flex flex-col items-center justify-center h-full text-silver-slate text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-accent-lime" />
                <span>Loading messaging history...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-silver-slate text-center p-6 space-y-2">
                <ChefHat className="w-8 h-8 text-white/10" />
                <p className="text-xs font-medium">Start the conversation!</p>
                <p className="text-[10px] text-silver-slate/50">
                  Ask Coach Esh questions about your workout, macros, or recovery.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCoach = msg.sender === "coach";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCoach ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${
                        isCoach
                          ? "bg-white/5 border border-white/5 text-ice-white rounded-tl-none"
                          : "bg-accent-lime text-cyber-slate font-medium rounded-tr-none"
                      }`}
                    >
                      <p className="m-0 leading-relaxed break-words">{msg.message}</p>
                    </div>
                    <span className="text-[8px] text-silver-slate/40 mt-1 uppercase">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-[#080A0E]/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Coach Esh..."
                className="flex-1 bg-white/5 border border-white/10 focus:border-accent-lime/50 rounded-xl px-4 py-2.5 text-xs text-ice-white placeholder:text-silver-slate/50 focus:outline-none transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-accent-lime hover:bg-accent-lime/90 disabled:opacity-40 text-cyber-slate p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-accent-lime/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

// Simple fallback icon in case ChefHat is needed
function ChefHat(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 18V6a4 4 0 0 1 8 0v12" />
      <path d="M18 18V9a4 4 0 0 0-8 0v9" />
      <path d="M3 18h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

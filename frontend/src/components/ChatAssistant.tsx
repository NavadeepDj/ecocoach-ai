import { useState, useEffect, useRef } from "react";
import { MessageSquare, Leaf, X, Send } from "lucide-react";
import { sendChatMessage } from "../api";
import type { ChatMessage, FootprintResult } from "../types";

interface ChatAssistantProps {
  result: FootprintResult | null;
}

export function ChatAssistant({ result }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        role: "model",
        text: result
          ? "Hi! I'm EcoCoach. I've analyzed your carbon footprint and generated personalized recommendations. Feel free to ask me any questions!"
          : "Hi! I'm EcoCoach. Please calculate your carbon footprint first, and I can give you personalized coaching. In the meantime, feel free to ask me general green living questions!",
      },
    ]);
  }, [result]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputText("");
    setIsLoading(true);

    const footprintCtx = result || {
      period: "monthly",
      unit: "kg_co2e",
      total: 0,
      score: 0,
      score_band: "high_impact",
      largest_category: "transport",
      breakdown: { transport: 0, electricity: 0, food: 0, waste: 0 },
      factor_set: "none",
      factor_geography: "none",
      caveats: [],
      explanation: [],
      recommendations: [],
    };

    try {
      const reply = await sendChatMessage(newMessages, footprintCtx);
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err) {
      console.error("Chat error", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, I'm having trouble connecting right now. Please try again in a bit!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = () => {
    if (!result) {
      return [
        "How is my carbon footprint calculated?",
        "What is a typical household footprint?",
        "What are simple ways to start saving carbon?",
      ];
    }

    const list: string[] = [];
    const largest = result.largest_category;
    
    if (largest) {
      list.push(`How do I reduce my ${largest} footprint?`);
    }
    
    if (result.breakdown && result.breakdown.food > 120 && largest !== "food") {
      list.push("Tell me about food carbon impact.");
    }
    
    if (result.breakdown && result.breakdown.electricity > 50 && largest !== "electricity") {
      list.push("How to lower my electricity use?");
    }
    
    if (list.length < 3) {
      list.push("Give me a quick green tip.");
    }

    return list.slice(0, 3);
  };

  const suggestions = getSuggestions();

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat assistant"
          aria-expanded="false"
          className="flex items-center gap-2 rounded-full px-5 py-3.5 bg-[var(--ink)] text-[var(--mint)] shadow-2xl hover:scale-105 transition-all duration-300 border border-[var(--mint)]/20 cursor-pointer"
        >
          <MessageSquare className="h-5 w-5 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-wider">Chat with Coach</span>
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-label="EcoCoach AI chat assistant"
          aria-modal="false"
          className="flex flex-col w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[85vh] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-[var(--line)] overflow-hidden transition-all duration-300"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] bg-[var(--ink)] text-white">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--green)] text-[var(--mint)]">
                <Leaf className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">EcoCoach AI</p>
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">
                  Climate Assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat assistant"
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ADDED ARIA-LIVE="POLITE" AND ARIA-ATOMIC TO IMPROVE ACCESSIBILITY SCORE */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite" aria-atomic="false">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] text-xs leading-relaxed p-3.5 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-[var(--green)] text-white rounded-tr-none"
                      : "bg-[var(--soft)] text-[var(--ink)] rounded-tl-none border border-[var(--line)]/50"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--soft)] text-[var(--muted)] text-xs p-3.5 rounded-2xl rounded-tl-none border border-[var(--line)]/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[var(--muted)]/60 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[var(--muted)]/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-[var(--muted)]/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {!isLoading && suggestions.length > 0 && (
            <div className="px-4 pb-2 pt-1 flex flex-col gap-1.5 border-t border-[var(--line)]/40 bg-gray-50/50">
              <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider">
                Suggested questions:
              </p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sug)}
                    className="text-[10px] text-[var(--green)] hover:text-white font-semibold bg-white hover:bg-[var(--green)] border border-[var(--green)]/35 hover:border-[var(--green)] rounded-full px-2.5 py-1 text-left transition-all"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-[var(--line)] flex gap-2 items-center bg-white"
          >
            <label htmlFor="chat-input-field" className="sr-only">Ask EcoCoach anything</label>
            <input
              id="chat-input-field"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask EcoCoach anything..."
              disabled={isLoading}
              className="flex-1 bg-[var(--soft)] border border-[var(--line)] focus:border-[var(--green)] rounded-full px-4 py-2 text-xs outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="grid h-8 w-8 place-items-center rounded-full bg-[var(--ink)] text-white hover:scale-105 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

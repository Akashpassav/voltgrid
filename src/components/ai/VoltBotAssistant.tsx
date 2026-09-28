"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Zap,
  Bot,
  User,
  ArrowRight,
  BatteryCharging,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/lib/auth/AuthContext";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  quickAction?: {
    label: string;
    href: string;
  };
}

const DRIVER_SUGGESTIONS = [
  "⚡ Find nearest 60kW DC Fast Charger",
  "🕒 Best off-peak time to charge today?",
  "🛵 Where can 2-wheelers charge (15A/Swap)?",
  "🆘 Battery below 10%! Emergency help",
];

const OPERATOR_SUGGESTIONS = [
  "⚡ Check peak hour load forecast",
  "⚠️ Active SOS escalations queue",
  "📊 Sholinganallur DC fast queue status",
  "🔌 Rebalance transformer power limits",
];

const HOST_SUGGESTIONS = [
  "💰 Calculate monthly earnings for 7.4kW plug",
  "🕒 How to set custom night tariff",
  "🛡️ What does host insurance cover?",
  "📝 How do payouts get settled?",
];

let messageSeq = 1;
function generateMessageId(prefix: string): string {
  messageSeq += 1;
  return `${prefix}-${messageSeq}`;
}

export function VoltBotAssistant() {
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const role = session?.role || "driver";
  const suggestions =
    role === "operator"
      ? OPERATOR_SUGGESTIONS
      : role === "host"
        ? HOST_SUGGESTIONS
        : DRIVER_SUGGESTIONS;

  const defaultGreeting =
    role === "operator"
      ? "Hello Operator! I am VoltBot Grid Copilot. I can assist with corridor load anomalies, peak hours, bay statuses, and SOS dispatch escalations."
      : role === "host"
        ? "Hello Host! I am VoltBot Community Advisor. I can help optimize your plug pricing, calculate passive earnings, and verify parking safety guidelines."
        : "Hello! I am VoltBot, your AI EV Charging Copilot ⚡. I can help you find fast DC chargers, book advance slots, calculate battery range, or find emergency assistance.";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-1",
      sender: "bot",
      text: defaultGreeting,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: Message = {
      id: generateMessageId("u"),
      sender: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // AI bot response generation logic
    setTimeout(() => {
      const q = userText.toLowerCase();
      let replyText = "";
      let action: Message["quickAction"] | undefined;

      if (q.includes("dc") || q.includes("fast") || q.includes("60kw") || q.includes("ccs2") || q.includes("nexon") || q.includes("4w")) {
        replyText =
          "I found 3 high-speed DC fast hubs along your corridor: **Tambaram GST Energy Plaza (60 kW)** with 3 available bays, and **Guindy Industrial Estate (25 kW)**. You can reserve a 45-minute slot in advance with guaranteed zero wait.";
        action = { label: "Book Slot at Tambaram (60kW)", href: "/stations" };
      } else if (q.includes("peak") || q.includes("time") || q.includes("queue") || q.includes("hour")) {
        replyText =
          "Corridor telemetry shows peak charging congestion occurs between **6:00 PM and 9:00 PM** (average queue: 18 mins). The optimal off-peak window is **1:00 PM – 4:30 PM** or after **9:30 PM**, where wait times drop to under 3 minutes.";
        action = { label: "Browse Off-Peak Slots", href: "/stations" };
      } else if (q.includes("2w") || q.includes("scooter") || q.includes("ather") || q.includes("ola") || q.includes("15a") || q.includes("swap")) {
        replyText =
          "For 2-wheelers, VoltGrid indexes **15A industrial socket points** (Ather Grid, Magenta, BPCL) and **Battery Smart / Sun Mobility Swapping kiosks** across Chennai & Bengaluru where swap time is under 2 minutes!";
        action = { label: "Filter 2-Wheeler Stations", href: "/stations" };
      } else if (q.includes("emergency") || q.includes("sos") || q.includes("stranded") || q.includes("low battery") || q.includes("10%")) {
        replyText =
          "⚠️ **EMERGENCY ASSISTANCE ACTIVE:** I recommend immediate diversion. Tap below to launch EV Roadside Rescue, flatbed towing dispatch, or find the nearest safe 15A plug within 2 km.";
        action = { label: "Launch EV Helpline & SOS", href: "/helpline" };
      } else if (q.includes("host") || q.includes("earn") || q.includes("share") || q.includes("home")) {
        replyText =
          "You can monetize your idle home wallbox or 15A socket by listing it on VoltGrid! Hosts typically earn ₹4,000–₹8,000/month by sharing their charger for 3–4 hours a day.";
        action = { label: "Host a Charger Portal", href: "/host" };
      } else {
        replyText =
          `I am monitoring 925+ verified charging stations across Tamil Nadu & Karnataka. You can search by connector type (CCS2, Type 2, 15A), check live bay availability, or reserve slots directly.`;
        action = { label: "Explore Stations Map", href: "/stations" };
      }

      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId("b"),
          sender: "bot",
          text: replyText,
          quickAction: action,
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-r from-volt to-emerald-400 px-5 text-navy-950 shadow-2xl shadow-volt/50 transition-all hover:scale-105 hover:shadow-volt/80"
          >
            <div className="relative">
              <Bot className="h-6 w-6 fill-navy-950" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-electric animate-ping" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-electric" />
            </div>
            <span className="text-xs font-extrabold tracking-wide">VoltBot AI</span>
          </button>
        )}
      </div>

      {/* Slide-out Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] sm:w-96 rounded-2xl border border-electric/30 bg-navy-900 shadow-2xl overflow-hidden flex flex-col h-[520px] animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line bg-navy-950 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-volt/15 text-volt border border-volt/30">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
                  VoltBot EV Copilot
                  <span className="h-1.5 w-1.5 rounded-full bg-volt animate-pulse" />
                </h3>
                <p className="text-[10px] text-mute">Real-time EV Station & Battery AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-mute hover:bg-navy-800 hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-volt/15 text-volt text-[10px] font-bold">
                    VB
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.sender === "user"
                      ? "bg-electric text-white font-medium"
                      : "bg-navy-950 text-ink/90 border border-line"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.quickAction && (
                    <Link
                      href={m.quickAction.href}
                      onClick={() => setIsOpen(false)}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-volt/15 border border-volt/30 px-2.5 py-1 text-[11px] font-bold text-volt hover:bg-volt/25 transition-colors"
                    >
                      {m.quickAction.label}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                {m.sender === "user" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-electric/20 text-electric text-[10px]">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-mute text-xs">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-volt/15 text-volt text-[10px]">
                  VB
                </div>
                <div className="flex gap-1 bg-navy-950 border border-line rounded-xl px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-volt animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-volt animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-volt animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions chips */}
          <div className="px-3 py-1.5 bg-navy-950/60 border-t border-line/40 flex gap-1.5 overflow-x-auto text-[10px]">
            {suggestions.map((s: string) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap rounded-full bg-navy-900 px-2.5 py-1 text-mute hover:text-ink hover:border-electric/50 border border-line transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 bg-navy-950 border-t border-line flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask VoltBot anything about EV charging…"
              className="flex-1 rounded-xl border border-line bg-navy-900 px-3.5 py-2 text-xs text-ink placeholder:text-mute focus:border-electric focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-xl bg-volt p-2 text-navy-950 disabled:opacity-40 hover:brightness-110 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

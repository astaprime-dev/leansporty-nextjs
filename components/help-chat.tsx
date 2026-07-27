"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";

/**
 * Grounded help chat. The API decides the audience (instructor vs buyer)
 * server-side from the session — this component is the same everywhere.
 * Streams plain-text chunks from /api/help-chat.
 */

type ChatTurn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS: Record<"instructor" | "buyer", string[]> = {
  instructor: [
    "How do I get paid?",
    "What happens to my class recording?",
    "How do programs work?",
  ],
  buyer: [
    "How long can I rewatch a class?",
    "How does the 21-Day Challenge work?",
    "How do I sign in?",
  ],
};

export function HelpChat({
  audience = "buyer",
}: {
  /** Display-only (suggested questions) — the API decides the real audience. */
  audience?: "instructor" | "buyer";
}) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || isLoading) return;
    setInput("");
    setIsLoading(true);
    const history = turns;
    setTurns((prev) => [
      ...prev,
      { role: "user", content: q },
      { role: "assistant", content: "" },
    ]);

    const appendToLast = (text: string) =>
      setTurns((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: last.content + text };
        return next;
      });

    try {
      const res = await fetch("/api/help-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        appendToLast(
          body.error ||
            "Something went wrong — please try again, or use the contact form."
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToLast(decoder.decode(value, { stream: true }));
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } catch {
      appendToLast(
        "Something went wrong — please try again, or use the contact form."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-pink-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-pink-50 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-400">
          <MessageCircle className="h-4.5 w-4.5 text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Quick answers</p>
          <p className="text-xs text-gray-500">
            Instant answers from our help guide — for anything else,{" "}
            <Link href="/contact" className="text-pink-600 underline">
              message us
            </Link>
            .
          </p>
        </div>
      </div>

      {turns.length === 0 ? (
        <div className="flex flex-wrap gap-2 px-5 py-4">
          {SUGGESTIONS[audience].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="rounded-full border border-pink-200 bg-pink-50/50 px-3 py-1.5 text-sm text-pink-700 transition-colors hover:bg-pink-100"
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="max-h-96 space-y-3 overflow-y-auto px-5 py-4"
        >
          {turns.map((turn, i) => (
            <div
              key={i}
              className={
                turn.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  turn.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-2 text-sm text-white"
                    : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-gray-50 px-4 py-2 text-sm text-gray-800"
                }
              >
                {turn.content ||
                  (isLoading && i === turns.length - 1 ? "…" : "")}
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        className="flex items-center gap-2 border-t border-pink-50 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          maxLength={1000}
          disabled={isLoading}
          aria-label="Ask the help assistant a question"
        />
        <Button
          type="submit"
          variant="brand"
          size="icon"
          disabled={isLoading || !input.trim()}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

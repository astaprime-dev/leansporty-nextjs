import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { loadGuide, systemIntro, type HelpAudience } from "@/lib/help-chat";

/**
 * Help assistant: answers questions grounded in docs/instructor-guide.md or
 * docs/buyer-guide.md depending on who is asking. Audience is decided
 * SERVER-SIDE from the session (instructor role in app_metadata), never by
 * the client. Anonymous visitors get the buyer guide — the bot is most
 * useful before someone buys. Streams plain text chunks.
 */

const MODEL = "claude-opus-5";
const MAX_QUESTION_CHARS = 1000;
const MAX_HISTORY_MESSAGES = 10;

// Best-effort in-memory rate limiter (per serverless instance, resets on cold
// start) — same pattern as the activation route. Keyed on user id when signed
// in, IP otherwise.
const MAX_REQUESTS = 15;
const WINDOW_MS = 10 * 60_000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function tooManyRequests(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

type ChatTurn = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "The help assistant isn't available right now." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const question =
    typeof body?.question === "string" ? body.question.trim() : "";
  if (!question || question.length > MAX_QUESTION_CHARS) {
    return Response.json({ error: "Please ask a question." }, { status: 400 });
  }

  // Short client-kept history so follow-up questions have context. Content is
  // untrusted user text either way — the system prompt is the authority.
  const history: ChatTurn[] = Array.isArray(body?.history)
    ? body.history
        .filter(
          (m: ChatTurn) =>
            (m?.role === "user" || m?.role === "assistant") &&
            typeof m?.content === "string" &&
            m.content.length <= 4000
        )
        .slice(-MAX_HISTORY_MESSAGES)
    : [];

  // Server-side audience detection: instructor role in the JWT wins.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const roles: string[] = user?.app_metadata?.roles ?? [];
  const audience: HelpAudience = roles.includes("instructor")
    ? "instructor"
    : "buyer";

  const rateKey =
    user?.id ??
    `ip:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"}`;
  if (tooManyRequests(rateKey)) {
    return Response.json(
      { error: "Too many questions for now — please try again in a few minutes, or use the contact form." },
      { status: 429 }
    );
  }

  // Every question is product signal — visible in Vercel logs.
  console.log(
    `[help-chat] audience=${audience} user=${user?.id ?? "anon"} q=${JSON.stringify(question.slice(0, 200))}`
  );

  const anthropic = new Anthropic();

  const params: Anthropic.Beta.Messages.MessageCreateParamsStreaming = {
    model: MODEL,
    max_tokens: 1024,
    stream: true,
    betas: ["server-side-fallback-2026-07-01"],
    system: [
      // Stable, cacheable prefix: rules + the full guide. The breakpoint sits
      // after the guide so repeat questions read it from cache (~10% price).
      {
        type: "text",
        text: `${systemIntro(audience)}\n\n--- THE GUIDE ---\n\n${loadGuide(audience)}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: question },
    ],
  };
  // Safety-classifier declines transparently retry on Anthropic's recommended
  // fallback model instead of surfacing an empty answer. (SDK typings may lag
  // this beta param, hence the assignment.)
  (params as unknown as Record<string, unknown>).fallbacks = "default";

  try {
    const stream = anthropic.beta.messages.stream(params);

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") {
            controller.enqueue(
              encoder.encode(
                "I can't help with that one — please use the contact form at leansporty.com/contact and a real person will help."
              )
            );
          }
        } catch (err) {
          console.error("[help-chat] stream error:", err);
          controller.enqueue(
            encoder.encode(
              "\n\nSomething went wrong on our side — please try again, or use the contact form at leansporty.com/contact."
            )
          );
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[help-chat] request error:", error);
    return Response.json(
      { error: "Something went wrong — please try again, or use the contact form." },
      { status: 500 }
    );
  }
}

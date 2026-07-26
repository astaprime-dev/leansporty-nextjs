"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { CopyLinkButton } from "@/components/instructor/copy-link-button";

/**
 * Ready-to-post sharing material for instructors: copy-link rows plus
 * prewritten captions (IG bio, story/post, WhatsApp/DM). Captions are plain
 * first-person English — instructors adapt/translate, but never start from a
 * blank box. Nothing here is tracked or stored; sharing again is always right.
 */

type ShareContext = {
  kind: "class" | "program";
  title: string;
  /** Site-relative path, e.g. /streams/<id> or /programs/<slug>. */
  path: string;
  /** Class start time (ISO) — formatted in the instructor's own timezone. */
  dateISO?: string;
};

function CaptionRow({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can fail (permissions/HTTP) — the select-on-focus fallback
      // still lets them copy by hand.
    }
  };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 text-xs font-medium text-pink-600 transition-colors hover:text-pink-500"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <textarea
        readOnly
        value={text}
        rows={text.length > 120 ? 3 : 2}
        suppressHydrationWarning
        onFocus={(e) => e.currentTarget.select()}
        className="w-full resize-none rounded-lg border border-pink-100 bg-pink-50/40 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
      />
    </div>
  );
}

export function ShareKit({
  slug,
  context,
}: {
  /** Instructor page slug — omit where unknown; the profile rows hide. */
  slug?: string | null;
  context?: ShareContext;
}) {
  const site = "leansporty.com";
  const profileUrl = slug ? `${site}/@${slug}` : null;
  const contextUrl = context ? `${site}${context.path}` : null;

  const dateLabel = context?.dateISO
    ? new Date(context.dateISO).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const storyCaption = context
    ? context.kind === "class"
      ? `I'm teaching "${context.title}" live${
          dateLabel ? ` on ${dateLabel}` : ""
        } — join me from home 👉 ${contextUrl}`
      : `My program "${context.title}" is out — train with me anytime, at your pace 👉 ${contextUrl}`
    : profileUrl
      ? `I'm teaching online now — live classes & programs, all here 👉 ${profileUrl}`
      : null;

  const dmMessage = context
    ? context.kind === "class"
      ? `Hi! I'm running a live class online: "${context.title}"${
          dateLabel ? ` on ${dateLabel}` : ""
        }. You can join from home — everything's here: ${contextUrl}`
      : `Hi! I just published my video program "${context.title}" — you can follow it anytime, from home. It's here: ${contextUrl}`
    : profileUrl
      ? `Hi! I'm teaching online now — live classes and video programs you can do from home. Everything's on my page: ${profileUrl}`
      : null;

  return (
    <div className="space-y-4">
      {/* Links */}
      <div className="flex flex-wrap gap-2">
        {slug && (
          <CopyLinkButton
            path={`/@${slug}`}
            label="Copy your page link"
            variant="brandOutline"
          />
        )}
        {context && (
          <CopyLinkButton
            path={context.path}
            label={
              context.kind === "class" ? "Copy class link" : "Copy program link"
            }
            variant="brandOutline"
          />
        )}
      </div>

      {/* Captions */}
      {profileUrl && (
        <CaptionRow
          label="Instagram bio"
          text={`Live classes & my programs 👉 ${profileUrl}`}
        />
      )}
      {storyCaption && (
        <CaptionRow label="Instagram story / post" text={storyCaption} />
      )}
      {dmMessage && <CaptionRow label="WhatsApp / DM" text={dmMessage} />}
    </div>
  );
}

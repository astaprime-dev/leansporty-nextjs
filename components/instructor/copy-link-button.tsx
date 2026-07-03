"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Link2 } from "lucide-react";

/**
 * Copy a class's public link to the clipboard (Studio plan S1.3). `path` is a
 * site-relative path (e.g. /streams/<id>/watch); the absolute URL is built from the
 * current origin at click time.
 */
export function CopyLinkButton({
  path,
  label = "Copy class link",
  size = "sm",
  variant = "outline",
  className,
}: {
  path: string;
  label?: string;
  size?: "sm" | "default";
  variant?: "outline" | "brandOutline";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      const url = `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can fail (permissions/HTTP) — no-op; the button simply doesn't confirm.
    }
  };

  return (
    <Button type="button" variant={variant} size={size} onClick={copy} className={className}>
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-1" /> Copied
        </>
      ) : (
        <>
          <Link2 className="w-4 h-4 mr-1" /> {label}
        </>
      )}
    </Button>
  );
}

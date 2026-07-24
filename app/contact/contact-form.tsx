"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { sendContactMessage, type ContactState } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    sendContactMessage,
    null
  );

  if (state?.ok) {
    return (
      <Alert variant="info">
        Message sent — thank you! We read everything and usually reply within a
        day.
      </Alert>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Honeypot — invisible to humans, irresistible to bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
          Your name <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 outline-none transition-colors focus:border-pink-300"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
          Your email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 outline-none transition-colors focus:border-pink-300"
        />
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          placeholder="A question, a problem, or just feedback — everything is welcome."
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 outline-none transition-colors focus:border-pink-300"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="brand" disabled={pending} className="self-start px-8">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

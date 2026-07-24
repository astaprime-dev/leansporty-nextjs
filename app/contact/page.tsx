import { ContactForm } from "./contact-form";

export const metadata = {
  title: "Contact us · Lean Sporty",
  description:
    "A question, a problem, or feedback about Lean Sporty — send us a message and we'll get back to you.",
};

export default function ContactPage() {
  return (
    <div className="w-full">
      <section className="bg-gradient-to-b from-pink-50 to-white">
        <div className="mx-auto max-w-2xl px-4 py-14 text-center">
          <h1 className="font-display text-4xl font-light tracking-tight text-gray-900 sm:text-5xl">
            How can we{" "}
            <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
              help
            </span>
            ?
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Something not working, a question before you buy, or feedback about
            a session — we read every message and usually reply within a day.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <ContactForm />
      </div>
    </div>
  );
}

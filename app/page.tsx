import HeroDance from "@/components/hero-dance";
import { LeadCaptureForm } from "@/components/lead-capture-form";

export default async function Home() {
  return (
    <div className="w-full">
      <HeroDance />
      <section className="border-t border-pink-100/70 bg-pink-50/40 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <LeadCaptureForm source="homepage" />
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, Users, Video } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { checkStreamEnrollment, getStreamById } from "@/app/actions";
import { EnrollOrBuy } from "@/components/stream/enroll-or-buy";
import { LocalDateTime } from "@/components/stream/local-datetime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiveDot } from "@/components/ui/live-dot";

export const dynamic = "force-dynamic";

/**
 * Public landing page for one class — THE link an instructor shares with her
 * followers. Works logged-out (title, cover, time, price, byline) and carries
 * the whole join path: sign-in modal → buy/enroll → watch. The watch page
 * itself stays auth+enrollment-gated and bounces strangers back here.
 */

function priceParts(stream: NonNullable<Awaited<ReturnType<typeof getStreamById>>>) {
  const isPaid = !!stream.product && stream.product.price_cents > 0;
  const priceLabel = isPaid
    ? new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: (stream.product!.currency || "eur").toUpperCase(),
      }).format(stream.product!.price_cents / 100)
    : null;
  return { isPaid, priceLabel };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const stream = await getStreamById(id);
  if (!stream || stream.status === "cancelled") {
    return { title: "Class", robots: { index: false, follow: false } };
  }

  const { isPaid, priceLabel } = priceParts(stream);
  const description =
    (stream.description && stream.description.slice(0, 160)) ||
    `A live dance & fitness class on Lean Sporty — join from home${
      isPaid ? ` for ${priceLabel}` : ", free"
    }.`;

  return {
    title: stream.title,
    description,
    alternates: { canonical: `/streams/${id}` },
    openGraph: {
      title: stream.title,
      description,
      type: "website",
      ...(stream.thumbnail_url ? { images: [{ url: stream.thumbnail_url }] } : {}),
    },
    twitter: {
      card: stream.thumbnail_url ? "summary_large_image" : "summary",
      title: stream.title,
      description,
    },
  };
}

export default async function PublicStreamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const stream = await getStreamById(id);
  if (!stream || stream.status === "cancelled") notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const enrollment = await checkStreamEnrollment(id);

  // Byline: instructors + user_profiles both FK auth.users, so nested selects
  // don't work — fetch separately and merge (house pattern).
  let instructorInfo: {
    name: string;
    slug: string | null;
    photoUrl: string | null;
  } | null = null;
  if (stream.instructor_id) {
    const { data: instructorRow } = await supabase
      .from("instructors")
      .select("user_id, slug")
      .eq("id", stream.instructor_id)
      .maybeSingle();
    if (instructorRow) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name, profile_photo_url")
        .eq("user_id", instructorRow.user_id)
        .maybeSingle();
      instructorInfo = {
        name: profile?.display_name ?? "Instructor",
        slug: instructorRow.slug ?? null,
        photoUrl: profile?.profile_photo_url ?? null,
      };
    }
  }

  const isLive = stream.status === "live";
  const isEnded = stream.status === "ended";
  const { isPaid, priceLabel } = priceParts(stream);
  const durationMinutes = Math.round(stream.scheduled_duration_seconds / 60);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Cover */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50">
        {stream.thumbnail_url ? (
          <Image
            src={stream.thumbnail_url}
            alt={stream.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Video className="h-12 w-12 text-pink-300" strokeWidth={1.5} />
          </div>
        )}

        {isLive && (
          <Badge
            variant="live"
            className="absolute left-4 top-4 gap-1.5 rounded-full px-3 py-1 text-xs shadow-sm"
          >
            <LiveDot size="sm" className="text-white" />
            LIVE
          </Badge>
        )}

        <div className="absolute right-4 top-4">
          {isEnded ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-600 shadow-sm backdrop-blur-sm">
              Ended
            </span>
          ) : isPaid ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur-sm">
              {priceLabel}
            </span>
          ) : (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-green-600 shadow-sm backdrop-blur-sm">
              Free
            </span>
          )}
        </div>
      </div>

      <h1 className="font-display mt-6 text-3xl font-light text-gray-900 sm:text-4xl">
        {stream.title}
      </h1>

      {instructorInfo && (
        <Link
          href={instructorInfo.slug ? `/@${instructorInfo.slug}` : "#"}
          className="group mt-3 inline-flex items-center gap-3"
        >
          {instructorInfo.photoUrl ? (
            <Image
              src={instructorInfo.photoUrl}
              alt={instructorInfo.name}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 font-medium text-pink-500">
              {instructorInfo.name.charAt(0)}
            </span>
          )}
          <span className="text-sm text-gray-600 transition-colors group-hover:text-pink-500">
            with <span className="font-medium">{instructorInfo.name}</span>
          </span>
        </Link>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-pink-400" />
          <LocalDateTime iso={stream.scheduled_start_time} />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-pink-400" /> {durationMinutes} minutes
        </span>
        {stream.total_enrollments > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4 text-pink-400" /> {stream.total_enrollments}{" "}
            enrolled
          </span>
        )}
      </div>

      {stream.description && (
        <p className="mt-4 whitespace-pre-line text-gray-700">
          {stream.description}
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-6">
        {isEnded ? (
          enrollment ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-gray-700">
                This class has ended. Your replay is available for 7 days after
                the class.
              </p>
              <Button asChild variant="brand">
                <Link href={`/streams/${stream.id}/watch`}>
                  Watch the recording
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-gray-700">This class has ended.</p>
              {instructorInfo?.slug && (
                <Button asChild variant="brandOutline">
                  <Link href={`/@${instructorInfo.slug}`}>
                    See more from {instructorInfo.name}
                  </Link>
                </Button>
              )}
            </div>
          )
        ) : (
          <EnrollOrBuy
            stream={stream}
            enrollment={enrollment}
            isAuthenticated={!!user}
          />
        )}
      </div>

      {!isEnded && (
        <p className="mt-4 text-xs text-muted-foreground">
          Every class is recorded automatically — if you can&apos;t make it
          live, you can rewatch for 7 days after it ends.
        </p>
      )}
    </div>
  );
}

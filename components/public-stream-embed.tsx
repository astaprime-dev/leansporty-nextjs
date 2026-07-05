/**
 * Public (unsigned) Cloudflare Stream embed for marketing surfaces — replaces
 * YouTube embeds (which leaked visitors via related videos, channel branding,
 * and a "3 subscribers" overlay). Only for PUBLIC UIDs: if requireSignedURLs
 * is ever enabled on the asset, this stops playing — use a dedicated public
 * trailer upload in that case.
 */
export function PublicStreamEmbed({
  uid,
  title,
  className = "",
}: {
  uid: string;
  title: string;
  className?: string;
}) {
  const code = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
  const src = `https://customer-${code}.cloudflarestream.com/${uid}/iframe?muted=true&autoplay=true&loop=true&controls=true&preload=metadata`;

  return (
    <iframe
      src={src}
      title={title}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      className={`absolute inset-0 h-full w-full border-0 ${className}`}
    />
  );
}

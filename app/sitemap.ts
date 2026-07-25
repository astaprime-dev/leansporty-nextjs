import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { CHALLENGE_SLUG } from '@/lib/challenge'

// Refresh hourly so new instructors/programs appear without a redeploy.
export const revalidate = 3600

// Always the production domain — a sitemap with preview-deploy URLs is worse
// than none (robots.ts already advertises this path on leansporty.com).
const BASE = 'https://leansporty.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/challenge`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/streams`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE}/teach`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${BASE}/terms`, changeFrequency: 'yearly', priority: 0.1 },
  ]

  // Cookie-less anon client: sitemap generation has no request context, and
  // everything listed here is public (RLS-readable) by design.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const dynamicPages: MetadataRoute.Sitemap = []

  const [{ data: instructors }, { data: programs }] = await Promise.all([
    supabase.from('instructors').select('slug'),
    supabase
      .from('products')
      .select('slug')
      .eq('kind', 'course')
      .eq('is_active', true)
      .eq('admin_disabled', false),
  ])

  for (const i of instructors ?? []) {
    if (i.slug) dynamicPages.push({ url: `${BASE}/${i.slug}`, changeFrequency: 'weekly', priority: 0.6 })
  }
  for (const p of programs ?? []) {
    // The challenge's program page redirects to /challenge — already listed.
    if (p.slug && p.slug !== CHALLENGE_SLUG) {
      dynamicPages.push({ url: `${BASE}/programs/${p.slug}`, changeFrequency: 'weekly', priority: 0.8 })
    }
  }

  return [...staticPages, ...dynamicPages]
}

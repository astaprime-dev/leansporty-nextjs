# Stripe — checkout session & webhook code

## Checkout session — `app/api/checkout/session/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { productSlug } = await req.json();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // product
  const { data: product } = await supabase
    .from('products').select('id, stripe_price_id, kind, is_active')
    .eq('slug', productSlug).single();
  if (!product || !product.is_active) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // already owned? (RLS limits to this user's rows)
  const { data: owned } = await supabase
    .from('entitlements').select('id')
    .eq('product_id', product.id)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .maybeSingle();
  if (owned) return NextResponse.json({ alreadyOwned: true });

  const origin = req.headers.get('origin') ?? 'https://leansporty.com';
  const session = await stripe.checkout.sessions.create({
    mode: product.kind === 'membership' ? 'subscription' : 'payment',
    line_items: [{ price: product.stripe_price_id!, quantity: 1 }],
    client_reference_id: user.id,                 // ← entitlement owner
    customer_email: user.email ?? undefined,
    metadata: { product_id: product.id },         // ← which product
    success_url: `${origin}/my-program?purchased=1&sid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/challenge?canceled=1`,
    // automatic_tax: { enabled: true },           // if using Stripe Tax (VAT decision OD-1)
  });
  return NextResponse.json({ url: session.url });
}
```

## Webhook — `app/api/stripe/webhook/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// service-role: the webhook has no user session and must write across users
const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();                  // RAW body — do not JSON.parse first
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }

  const db = admin();
  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      await db.from('entitlements').upsert({
        user_id: s.client_reference_id!,
        product_id: s.metadata!.product_id,
        source: 'stripe',
        stripe_session_id: s.id,
        expires_at: s.metadata?.expires_at ?? null, // null = lifetime; set for membership
      }, { onConflict: 'user_id,product_id' });
      break;
    }
    case 'charge.refunded':
    case 'charge.dispute.created': {
      const c = event.data.object as Stripe.Charge;
      // resolve the entitlement via the originating session; revoke (or expire) it
      const sessionId = (c as any).payment_intent
        ? (await stripe.checkout.sessions.list({ payment_intent: c.payment_intent as string })).data[0]?.id
        : undefined;
      if (sessionId) await db.from('entitlements').delete().eq('stripe_session_id', sessionId);
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const expiresAt = new Date(sub.current_period_end * 1000).toISOString();
      // look up the membership product + user from sub metadata/customer, then:
      // await db.from('entitlements').update({ expires_at: expiresAt }).eq(...)
      break;
    }
  }
  return NextResponse.json({ received: true });
}
```

Notes:
- Idempotent: upsert on `(user_id, product_id)`; repeated deletes are harmless.
- For memberships, set `metadata.expires_at` at session creation, or derive it from `current_period_end` in the subscription events.
- Connect (Phase 4): add `payment_intent_data.application_fee_amount` + `transfer_data.destination` (or use destination charges) at session creation; the grant logic here is unchanged.
- Log every grant/revoke with `stripe_session_id`; alert on `constructEvent` failures.

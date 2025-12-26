import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Cleanup Stale Watch Sessions Cron Job
 *
 * Automatically closes watch sessions that haven't received a heartbeat
 * for 2+ minutes. This handles cases where users close their browser
 * or lose connectivity without properly ending their watch session.
 *
 * Schedule: Every 5 minutes via Vercel Cron
 * Auth: Requires CRON_SECRET in Authorization header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Call the database function to close stale sessions
    const { data, error } = await supabase.rpc('close_stale_watch_sessions');

    if (error) {
      console.error('Failed to close stale sessions:', error);
      throw error;
    }

    const closedCount = data || 0;

    console.log(`[Cleanup Cron] Successfully closed ${closedCount} stale watch sessions`);

    return NextResponse.json({
      success: true,
      closedSessions: closedCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Cleanup Cron] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to cleanup stale sessions',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

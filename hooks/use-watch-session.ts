'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface UseWatchSessionProps {
  streamId: string;
  enrollmentId: string;
  sessionType: 'live' | 'replay';
  enabled: boolean; // Only track when player is actually playing
}

interface WatchSession {
  id: string;
  totalWatchSeconds: number;
}

/**
 * Hook to track user watch duration for live streams
 * Sends heartbeat every 30 seconds while video is playing
 * Tracks attendance for 50% requirement to comment
 */
export function useWatchSession({
  streamId,
  enrollmentId,
  sessionType,
  enabled,
}: UseWatchSessionProps) {
  const [session, setSession] = useState<WatchSession | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Start watch session
  const startSession = useCallback(async () => {
    if (!enabled || isTracking) return;

    try {
      const { data, error } = await supabase
        .from('stream_watch_sessions')
        .insert({
          enrollment_id: enrollmentId,
          stream_id: streamId,
          session_type: sessionType,
          started_at: new Date().toISOString(),
          last_heartbeat_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to start watch session:', error);
        return;
      }

      setSession({
        id: data.id,
        totalWatchSeconds: 0,
      });
      setIsTracking(true);

      // Start heartbeat interval (30 seconds)
      heartbeatIntervalRef.current = setInterval(() => {
        sendHeartbeat(data.id);
      }, 30000);

    } catch (error) {
      console.error('Failed to start watch session:', error);
    }
  }, [enabled, enrollmentId, streamId, sessionType, isTracking, supabase]);

  // Send heartbeat to update watch duration
  const sendHeartbeat = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase.rpc('increment_watch_duration', {
        p_session_id: sessionId,
        p_increment_seconds: 30,
      });

      if (error) {
        console.error('Heartbeat failed:', error);
        return;
      }

      // Update local state with new total
      setSession(prev => prev ? {
        ...prev,
        totalWatchSeconds: data as number,
      } : null);

    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }, [supabase]);

  // End watch session
  const endSession = useCallback(async () => {
    if (!session || !isTracking) return;

    try {
      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Close session in database
      await supabase
        .from('stream_watch_sessions')
        .update({
          ended_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      setIsTracking(false);
      setSession(null);

    } catch (error) {
      console.error('Failed to end watch session:', error);
    }
  }, [session, isTracking, supabase]);

  // Effect: Start/end based on enabled state
  useEffect(() => {
    if (enabled && !isTracking) {
      startSession();
    } else if (!enabled && isTracking) {
      endSession();
    }
  }, [enabled, isTracking, startSession, endSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (isTracking && session) {
        // Fire-and-forget end session on unmount
        void (async () => {
          try {
            await supabase
              .from('stream_watch_sessions')
              .update({ ended_at: new Date().toISOString() })
              .eq('id', session.id);
            console.log('Watch session ended on unmount');
          } catch (err) {
            console.error('Failed to end session on unmount:', err);
          }
        })();
      }
    };
  }, [isTracking, session, supabase]);

  return {
    session,
    isTracking,
    startSession,
    endSession,
  };
}

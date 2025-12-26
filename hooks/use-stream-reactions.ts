'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import type {
  StreamReactionAggregate,
  ReactionEvent,
  ReactionType,
} from '@/types/reactions';
import { isTechnicalReaction } from '@/types/reactions';

/**
 * Custom hook for subscribing to real-time stream reactions
 *
 * @param streamId - The ID of the stream to subscribe to
 * @param onTechnicalAlert - Optional callback for technical alerts (plays sound, shows notification)
 * @returns Array of recent reaction events
 */
export function useStreamReactions(
  streamId: string | null,
  onTechnicalAlert?: (reactionType: ReactionType, count: number) => void
) {
  const [reactionEvents, setReactionEvents] = useState<ReactionEvent[]>([]);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Cleanup old reactions (remove events older than 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setReactionEvents(prev =>
        prev.filter(event => now - event.timestamp < 5000)
      );
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  // Subscribe to reaction aggregates
  useEffect(() => {
    if (!streamId) return;

    const channel = supabase
      .channel(`stream:${streamId}:reactions`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_reaction_aggregates',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          const aggregate = payload.new as StreamReactionAggregate;

          // Create reaction event
          const event: ReactionEvent = {
            id: aggregate.id,
            reaction_type: aggregate.reaction_type,
            count: aggregate.count,
            timestamp: Date.now(),
            isAggregate: aggregate.count >= 3,
            isTechnical: isTechnicalReaction(aggregate.reaction_type),
          };

          // Add to events list
          setReactionEvents(prev => [...prev, event]);

          // Trigger technical alert callback if applicable
          if (event.isTechnical && onTechnicalAlert) {
            onTechnicalAlert(event.reaction_type, event.count);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stream_reaction_aggregates',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          const aggregate = payload.new as StreamReactionAggregate;

          // Update existing event or create new one
          setReactionEvents(prev => {
            const existingIndex = prev.findIndex(
              e => e.id === aggregate.id
            );

            if (existingIndex >= 0) {
              // Update existing event
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                count: aggregate.count,
                isAggregate: aggregate.count >= 3,
                timestamp: Date.now(), // Refresh timestamp
              };
              return updated;
            } else {
              // Create new event
              const event: ReactionEvent = {
                id: aggregate.id,
                reaction_type: aggregate.reaction_type,
                count: aggregate.count,
                timestamp: Date.now(),
                isAggregate: aggregate.count >= 3,
                isTechnical: isTechnicalReaction(aggregate.reaction_type),
              };

              // Trigger technical alert if applicable
              if (event.isTechnical && onTechnicalAlert) {
                onTechnicalAlert(event.reaction_type, event.count);
              }

              return [...prev, event];
            }
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [streamId, onTechnicalAlert, supabase]);

  return reactionEvents;
}

/**
 * Hook for sending reactions (viewer side)
 *
 * @param streamId - The ID of the stream to send reactions to
 * @returns Object with sendReaction function and cooldown state
 */
export function useSendReaction(streamId: string | null) {
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const supabase = createClient();

  const sendReaction = useCallback(
    async (reactionType: ReactionType) => {
      if (!streamId || isOnCooldown) return;

      try {
        // Insert reaction into database
        const { error } = await supabase.from('stream_reactions').insert({
          stream_id: streamId,
          reaction_type: reactionType,
        });

        if (error) {
          // Check if it's a rate limit error
          if (error.message.includes('Rate limit')) {
            console.warn('Rate limit exceeded');
            // Toast notification will be handled by component
            return { success: false, error: 'rate_limit' };
          }
          throw error;
        }

        // Start cooldown
        setIsOnCooldown(true);
        setCooldownRemaining(5);

        // Countdown timer
        const countdown = setInterval(() => {
          setCooldownRemaining(prev => {
            if (prev <= 1) {
              clearInterval(countdown);
              setIsOnCooldown(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return { success: true };
      } catch (error) {
        console.error('Error sending reaction:', error);
        return { success: false, error: 'unknown' };
      }
    },
    [streamId, isOnCooldown, supabase]
  );

  return {
    sendReaction,
    isOnCooldown,
    cooldownRemaining,
  };
}

/**
 * Hook for fetching reaction analytics (instructor side)
 *
 * @param streamId - The ID of the stream to fetch analytics for
 * @returns Reaction analytics data
 */
export function useReactionAnalytics(streamId: string | null) {
  const [analytics, setAnalytics] = useState<{
    totalReactions: number;
    breakdown: { reaction_type: ReactionType; count: number }[];
    timeline: { time_bucket: string; reaction_type: ReactionType; count: number }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!streamId) return;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch total reactions by type
        const { data: breakdown, error: breakdownError } = await supabase
          .from('stream_reactions')
          .select('reaction_type')
          .eq('stream_id', streamId);

        if (breakdownError) throw breakdownError;

        // Calculate breakdown
        const reactionCounts = breakdown.reduce((acc, row) => {
          acc[row.reaction_type] = (acc[row.reaction_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const breakdownArray = Object.entries(reactionCounts).map(
          ([reaction_type, count]) => ({
            reaction_type: reaction_type as ReactionType,
            count,
          })
        );

        // Fetch timeline data (5-minute buckets)
        const { data: timeline, error: timelineError } = await supabase.rpc(
          'get_reaction_timeline',
          { p_stream_id: streamId }
        );

        // Note: We'll need to create this RPC function in the database
        // For now, just use the breakdown data

        setAnalytics({
          totalReactions: breakdown.length,
          breakdown: breakdownArray,
          timeline: timeline || [],
        });
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching reaction analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [streamId, supabase]);

  return { analytics, isLoading, error };
}

/**
 * Utility function to play alert sound using Web Audio API
 * Generates a simple beep sound programmatically (no audio file needed)
 */
export function playAlertSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure beep sound
    oscillator.frequency.value = 800; // 800 Hz frequency
    oscillator.type = 'sine';

    // Envelope (fade in/out to avoid clicking)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.15);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.error('Error playing alert sound:', error);
  }
}

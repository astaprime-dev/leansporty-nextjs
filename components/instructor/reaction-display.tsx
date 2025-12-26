'use client';

import { useState, useCallback } from 'react';
import { useStreamReactions, playAlertSound } from '@/hooks/use-stream-reactions';
import {
  getReactionConfig,
  type ReactionType,
  type ReactionEvent,
} from '@/types/reactions';
import { ReactionIcon } from '@/components/stream/reaction-icon';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ReactionDisplayProps {
  streamId: string;
  isLive: boolean;
  className?: string;
}

/**
 * ReactionDisplay Component
 *
 * Displays real-time reactions from viewers on the instructor's screen.
 * Shows floating emoji bubbles, aggregation counters, and technical alerts.
 */
export function ReactionDisplay({
  streamId,
  isLive,
  className,
}: ReactionDisplayProps) {
  const [technicalAlerts, setTechnicalAlerts] = useState<
    Map<ReactionType, { count: number; timestamp: number }>
  >(new Map());

  // Handle technical alerts (play sound and show persistent alert)
  const handleTechnicalAlert = useCallback(
    (reactionType: ReactionType, count: number) => {
      // Play alert sound
      playAlertSound();

      // Add/update technical alert
      setTechnicalAlerts(prev => {
        const next = new Map(prev);
        next.set(reactionType, { count, timestamp: Date.now() });
        return next;
      });
    },
    []
  );

  // Subscribe to reactions
  const reactionEvents = useStreamReactions(
    isLive ? streamId : null,
    handleTechnicalAlert
  );

  // Dismiss technical alert
  const dismissAlert = useCallback((reactionType: ReactionType) => {
    setTechnicalAlerts(prev => {
      const next = new Map(prev);
      next.delete(reactionType);
      return next;
    });
  }, []);

  // Don't show if stream is not live
  if (!isLive) {
    return null;
  }

  // Filter out technical reactions from floating bubbles (they're shown as alerts)
  const floatingReactions = reactionEvents.filter(e => !e.isTechnical);

  return (
    <div className={cn('absolute inset-0 pointer-events-none z-10', className)}>
      {/* Floating Reaction Bubbles */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingReactions.map((event) => (
          <FloatingReactionBubble key={event.id} event={event} />
        ))}
      </div>

      {/* Aggregation Counters (Top Right) */}
      {floatingReactions.length > 0 && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {getActiveReactionCounts(floatingReactions).map(
            ({ reactionType, count }) => {
              if (count < 3) return null; // Only show aggregation for 3+

              const config = getReactionConfig(reactionType);

              return (
                <div
                  key={reactionType}
                  className="flex items-center gap-2 bg-black/70 text-white px-3 py-2 rounded-full shadow-lg animate-in fade-in zoom-in-95 duration-200"
                >
                  <ReactionIcon iconName={config.icon} className="w-6 h-6 text-white" />
                  <span className="text-lg font-bold">{count}</span>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Technical Alerts (Bottom) */}
      {Array.from(technicalAlerts.entries()).map(
        ([reactionType, { count }]) => {
          const config = getReactionConfig(reactionType);

          return (
            <div
              key={reactionType}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              <div className="flex items-center gap-3 bg-red-500 text-white px-4 py-3 rounded-lg shadow-xl border-2 border-red-400 animate-pulse">
                <ReactionIcon iconName={config.icon} className="w-8 h-8 text-white" />
                <div>
                  <p className="font-bold text-sm">
                    {count} {count === 1 ? 'user' : 'users'} reporting:
                  </p>
                  <p className="text-sm">{config.label}</p>
                </div>
                <button
                  onClick={() => dismissAlert(reactionType)}
                  className="ml-2 p-1 hover:bg-red-600 rounded-full transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

/**
 * Floating Reaction Bubble Component
 *
 * Individual emoji bubble that floats up and fades out
 */
function FloatingReactionBubble({ event }: { event: ReactionEvent }) {
  const config = getReactionConfig(event.reaction_type);

  // Random horizontal position (20% to 80% of width)
  const leftPosition = Math.random() * 60 + 20;

  return (
    <div
      className="absolute bottom-0 animate-float-up"
      style={{
        left: `${leftPosition}%`,
        animationDuration: '3.5s',
        animationTimingFunction: 'ease-out',
      }}
    >
      <div className="flex items-center gap-2 drop-shadow-2xl">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 border-2 border-white/40">
          <ReactionIcon iconName={config.icon} className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
        </div>
        {event.isAggregate && (
          <span className="text-2xl font-bold text-white bg-black/50 px-3 py-1 rounded-full">
            {event.count}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Helper function to get active reaction counts from recent events
 * Groups reactions by type that occurred in the last 2 seconds
 */
function getActiveReactionCounts(events: ReactionEvent[]): {
  reactionType: ReactionType;
  count: number;
}[] {
  const now = Date.now();
  const recentEvents = events.filter(e => now - e.timestamp < 2000);

  const counts = new Map<ReactionType, number>();

  recentEvents.forEach(event => {
    const current = counts.get(event.reaction_type) || 0;
    counts.set(event.reaction_type, current + event.count);
  });

  return Array.from(counts.entries()).map(([reactionType, count]) => ({
    reactionType,
    count,
  }));
}

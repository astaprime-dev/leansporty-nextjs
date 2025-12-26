'use client';

import { useState } from 'react';
import { useSendReaction } from '@/hooks/use-stream-reactions';
import {
  REACTION_BUTTONS,
  REACTION_COLOR_CLASSES,
  type ReactionType,
} from '@/types/reactions';
import { cn } from '@/lib/utils';

interface ReactionButtonsProps {
  streamId: string;
  isLive: boolean;
  className?: string;
}

/**
 * ReactionButtons Component
 *
 * Displays interactive reaction buttons for viewers to send feedback
 * during live streams. Features 5-second cooldown and color-coded buttons.
 */
export function ReactionButtons({
  streamId,
  isLive,
  className,
}: ReactionButtonsProps) {
  const { sendReaction, isOnCooldown, cooldownRemaining } =
    useSendReaction(streamId);
  const [lastReaction, setLastReaction] = useState<ReactionType | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Don't show buttons if stream is not live
  if (!isLive) {
    return null;
  }

  const handleReaction = async (reactionType: ReactionType) => {
    const result = await sendReaction(reactionType);

    if (result?.success) {
      // Show success feedback
      setLastReaction(reactionType);
      setTimeout(() => setLastReaction(null), 300);
    } else if (result?.error === 'rate_limit') {
      // Show rate limit toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <>
      {/* Reaction Buttons Container */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-10',
          'flex items-center justify-center gap-2 sm:gap-3',
          'p-4 pb-6 sm:pb-8',
          'bg-gradient-to-t from-black/50 to-transparent',
          'pointer-events-none', // Allow clicks to pass through container
          className
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {REACTION_BUTTONS.map((button) => {
            const colorClasses = REACTION_COLOR_CLASSES[button.color];
            const isPressed = lastReaction === button.type;

            return (
              <button
                key={button.type}
                onClick={() => handleReaction(button.type)}
                disabled={isOnCooldown}
                className={cn(
                  // Base styles
                  'relative flex flex-col items-center justify-center',
                  'min-w-[60px] min-h-[60px] sm:min-w-[70px] sm:min-h-[70px]',
                  'rounded-full',
                  'transition-all duration-200',
                  'shadow-lg',

                  // Color styles
                  isOnCooldown
                    ? 'bg-gray-400 cursor-not-allowed'
                    : `${colorClasses.bg} ${colorClasses.hover} cursor-pointer`,

                  // Pressed state
                  isPressed && 'scale-90',

                  // Disabled state
                  isOnCooldown && 'opacity-50'
                )}
                aria-label={button.label}
                title={button.label}
              >
                {/* Emoji */}
                <span className="text-2xl sm:text-3xl">{button.emoji}</span>

                {/* Cooldown Timer */}
                {isOnCooldown && (
                  <span className="absolute -top-2 -right-2 bg-white text-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                    {cooldownRemaining}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cooldown Toast */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-medium">
              Wait {cooldownRemaining}s between reactions
            </p>
          </div>
        </div>
      )}

      {/* Button Labels (Desktop Only) */}
      <div
        className={cn(
          'hidden lg:block',
          'fixed bottom-20 left-0 right-0 z-10',
          'flex items-center justify-center gap-2 sm:gap-3',
          'pointer-events-none'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {REACTION_BUTTONS.map((button) => (
            <div
              key={button.type}
              className="min-w-[60px] sm:min-w-[70px] text-center"
            >
              <p className="text-xs text-white/90 font-medium drop-shadow-md">
                {button.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

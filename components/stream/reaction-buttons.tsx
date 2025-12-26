'use client';

import { useState } from 'react';
import { useSendReaction } from '@/hooks/use-stream-reactions';
import {
  REACTION_BUTTONS,
  REACTION_COLOR_CLASSES,
  type ReactionType,
} from '@/types/reactions';
import { ReactionIcon } from '@/components/stream/reaction-icon';
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
          // Mobile: Fixed at bottom
          'fixed bottom-0 left-0 right-0 z-10 lg:relative',
          'flex items-center justify-center',
          'p-4 pb-safe lg:p-0',
          'bg-gradient-to-t from-black/50 to-transparent lg:bg-none',
          // Desktop: Static sidebar
          'lg:flex-col lg:justify-start lg:items-center',
          'lg:gap-3',
          className
        )}
      >
        <div className={cn(
          'flex gap-2 sm:gap-3',
          'lg:flex-col lg:gap-3 lg:sticky lg:top-1/2 lg:-translate-y-1/2'
        )}>
          {REACTION_BUTTONS.map((button) => {
            const colorClasses = REACTION_COLOR_CLASSES[button.color];
            const isPressed = lastReaction === button.type;

            return (
              <div key={button.type} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleReaction(button.type)}
                  disabled={isOnCooldown}
                  className={cn(
                    // Base styles
                    'relative flex items-center justify-center',
                    'w-[40px] h-[40px] lg:w-[45px] lg:h-[45px]',
                    'rounded-full',
                    'transition-all duration-300',
                    'border-2 border-white',

                    // Shadow and effects
                    'shadow-2xl hover:shadow-3xl',

                    // Color styles
                    isOnCooldown
                      ? 'bg-gray-400 cursor-not-allowed'
                      : `${colorClasses.bg} ${colorClasses.hover} cursor-pointer hover:scale-110`,

                    // Pressed state
                    isPressed && 'scale-95',

                    // Disabled state
                    isOnCooldown && 'opacity-50',

                    // Glow effect for non-disabled
                    !isOnCooldown && button.color === 'green' && 'hover:shadow-green-500/50',
                    !isOnCooldown && button.color === 'yellow' && 'hover:shadow-yellow-500/50',
                    !isOnCooldown && button.color === 'red' && 'hover:shadow-red-500/50'
                  )}
                  aria-label={button.label}
                  title={button.label}
                >
                  {/* SVG Icon */}
                  <ReactionIcon
                    iconName={button.icon}
                    className="w-5 h-5 lg:w-6 lg:h-6 text-white drop-shadow-lg"
                  />

                  {/* Cooldown Timer */}
                  {isOnCooldown && (
                    <span className="absolute -top-1 -right-1 bg-white text-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg border border-gray-200">
                      {cooldownRemaining}
                    </span>
                  )}
                </button>

                {/* Label below button */}
                <span className="text-[10px] font-normal text-black text-center px-2 py-0.5 bg-white rounded shadow-sm">
                  {button.label}
                </span>
              </div>
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

    </>
  );
}

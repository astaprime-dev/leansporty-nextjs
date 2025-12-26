'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

/**
 * Star Rating Component
 * Displays 1-5 star rating with interactive or read-only modes
 */
export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value;

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className={cn('flex gap-1', className)}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = rating <= displayValue;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => !readonly && setHoverValue(rating)}
            onMouseLeave={() => !readonly && setHoverValue(null)}
            disabled={readonly}
            className={cn(
              'transition-all',
              !readonly && 'cursor-pointer hover:scale-110',
              readonly && 'cursor-default'
            )}
            aria-label={`${rating} star${rating !== 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300',
                !readonly && 'hover:text-yellow-400'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

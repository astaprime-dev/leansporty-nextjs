import { ThumbsUp, Flame, Gauge, EyeOff, VolumeX } from 'lucide-react';

interface ReactionIconProps {
  iconName: string;
  className?: string;
}

/**
 * Dynamic icon component for reaction buttons
 * Maps icon names to lucide-react icons
 */
export function ReactionIcon({ iconName, className }: ReactionIconProps) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    ThumbsUp,
    Flame,
    Gauge,
    EyeOff,
    VolumeX,
  };

  const Icon = iconMap[iconName];

  if (!Icon) {
    console.warn(`Icon "${iconName}" not found, using default`);
    return <ThumbsUp className={className} />;
  }

  return <Icon className={className} />;
}

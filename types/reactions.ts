/**
 * Live Stream Reaction System - TypeScript Type Definitions
 */

/**
 * Available reaction types that viewers can send during live streams
 */
export type ReactionType =
  | 'love_it'        // 👍 Positive energy/good move
  | 'feeling_burn'   // 🔥 High intensity moment
  | 'need_slower'    // 😅 Pacing too fast
  | 'cant_see'       // ⚠️ Video problem
  | 'no_audio';      // 🔇 Sound problem

/**
 * Reaction color scheme for UI styling
 */
export type ReactionColor = 'green' | 'yellow' | 'red';

/**
 * Individual reaction record from the database
 */
export interface StreamReaction {
  id: string;
  stream_id: string;
  user_id: string | null;  // Anonymous to instructor, but stored for analytics
  reaction_type: ReactionType;
  created_at: string;      // ISO timestamp
}

/**
 * Aggregated reaction count for a specific time window
 */
export interface StreamReactionAggregate {
  id: string;
  stream_id: string;
  reaction_type: ReactionType;
  count: number;
  time_window: string;     // ISO timestamp of window start
  last_updated_at: string; // ISO timestamp
}

/**
 * Configuration for a single reaction button
 */
export interface ReactionButtonConfig {
  type: ReactionType;
  emoji: string;
  label: string;
  color: ReactionColor;
  isTechnical?: boolean;   // True for technical alerts (cant_see, no_audio)
}

/**
 * Reaction event for real-time display
 */
export interface ReactionEvent {
  id: string;
  reaction_type: ReactionType;
  count: number;           // 1 for individual, 3+ for aggregated
  timestamp: number;       // JavaScript timestamp for animation timing
  isAggregate: boolean;    // True if showing aggregated count
  isTechnical: boolean;    // True for technical alerts
}

/**
 * Reaction analytics summary for post-class review
 */
export interface ReactionAnalytics {
  stream_id: string;
  total_reactions: number;
  breakdown: {
    reaction_type: ReactionType;
    count: number;
    percentage: number;
  }[];
  technical_issues: {
    reaction_type: 'cant_see' | 'no_audio';
    count: number;
    timestamps: string[];  // ISO timestamps
  }[];
  peak_moments: {
    time: string;          // ISO timestamp
    reaction_counts: {
      [key in ReactionType]?: number;
    };
    total: number;
  }[];
}

/**
 * Timeline data point for reaction graph
 */
export interface ReactionTimelineData {
  time_bucket: string;     // ISO timestamp
  reaction_type: ReactionType;
  count: number;
}

/**
 * Complete reaction button configuration array
 */
export const REACTION_BUTTONS: ReactionButtonConfig[] = [
  {
    type: 'love_it',
    emoji: '👍',
    label: 'Love it!',
    color: 'green',
    isTechnical: false,
  },
  {
    type: 'feeling_burn',
    emoji: '🔥',
    label: 'Feeling the burn!',
    color: 'green',
    isTechnical: false,
  },
  {
    type: 'need_slower',
    emoji: '😅',
    label: 'Need slower',
    color: 'yellow',
    isTechnical: false,
  },
  {
    type: 'cant_see',
    emoji: '⚠️',
    label: "Can't see you",
    color: 'red',
    isTechnical: true,
  },
  {
    type: 'no_audio',
    emoji: '🔇',
    label: 'No audio',
    color: 'red',
    isTechnical: true,
  },
];

/**
 * Helper function to get reaction config by type
 */
export function getReactionConfig(type: ReactionType): ReactionButtonConfig {
  const config = REACTION_BUTTONS.find(btn => btn.type === type);
  if (!config) {
    throw new Error(`Unknown reaction type: ${type}`);
  }
  return config;
}

/**
 * Helper function to check if a reaction is a technical alert
 */
export function isTechnicalReaction(type: ReactionType): boolean {
  return type === 'cant_see' || type === 'no_audio';
}

/**
 * Emoji mapping for quick lookup
 */
export const REACTION_EMOJIS: Record<ReactionType, string> = {
  love_it: '👍',
  feeling_burn: '🔥',
  need_slower: '😅',
  cant_see: '⚠️',
  no_audio: '🔇',
};

/**
 * Color class mapping for Tailwind CSS
 */
export const REACTION_COLOR_CLASSES: Record<ReactionColor, {
  bg: string;
  text: string;
  border: string;
  hover: string;
}> = {
  green: {
    bg: 'bg-green-500',
    text: 'text-green-600',
    border: 'border-green-500',
    hover: 'hover:bg-green-600',
  },
  yellow: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-600',
    border: 'border-yellow-500',
    hover: 'hover:bg-yellow-600',
  },
  red: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    border: 'border-red-500',
    hover: 'hover:bg-red-600',
  },
};

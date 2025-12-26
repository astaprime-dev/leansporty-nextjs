'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { createClient } from '@/utils/supabase/client';
import {
  getReactionConfig,
  type ReactionType,
  type ReactionTimelineData,
} from '@/types/reactions';
import { AlertCircle, TrendingUp, Users, Clock } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StreamAnalyticsProps {
  streamId: string;
}

interface ReactionBreakdown {
  reaction_type: ReactionType;
  count: number;
  percentage: number;
}

interface TechnicalIssue {
  reaction_type: 'cant_see' | 'no_audio';
  count: number;
  first_reported: string;
  last_reported: string;
}

/**
 * StreamAnalytics Component
 *
 * Displays post-class analytics for reaction data including:
 * - Total reaction breakdown by type
 * - Timeline graph showing reaction patterns
 * - Technical issue summary
 */
export function StreamAnalytics({ streamId }: StreamAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [totalReactions, setTotalReactions] = useState(0);
  const [breakdown, setBreakdown] = useState<ReactionBreakdown[]>([]);
  const [timeline, setTimeline] = useState<ReactionTimelineData[]>([]);
  const [technicalIssues, setTechnicalIssues] = useState<TechnicalIssue[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
  }, [streamId]);

  const fetchAnalytics = async () => {
    setLoading(true);

    try {
      // Fetch all reactions for this stream
      const { data: reactions, error } = await supabase
        .from('stream_reactions')
        .select('reaction_type, created_at')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!reactions || reactions.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate total reactions
      setTotalReactions(reactions.length);

      // Calculate breakdown by type
      const reactionCounts = reactions.reduce((acc, row) => {
        acc[row.reaction_type] = (acc[row.reaction_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const breakdownData: ReactionBreakdown[] = Object.entries(reactionCounts)
        .map(([reaction_type, count]) => ({
          reaction_type: reaction_type as ReactionType,
          count,
          percentage: Math.round((count / reactions.length) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      setBreakdown(breakdownData);

      // Calculate timeline (1-minute buckets)
      const timelineBuckets = new Map<string, Map<ReactionType, number>>();

      reactions.forEach((reaction) => {
        const time = new Date(reaction.created_at);
        // Round down to minute
        time.setSeconds(0, 0);
        const bucket = time.toISOString();

        if (!timelineBuckets.has(bucket)) {
          timelineBuckets.set(bucket, new Map());
        }

        const bucketData = timelineBuckets.get(bucket)!;
        const currentCount = bucketData.get(reaction.reaction_type) || 0;
        bucketData.set(reaction.reaction_type, currentCount + 1);
      });

      // Convert to array format
      const timelineData: ReactionTimelineData[] = [];
      timelineBuckets.forEach((reactionMap, time_bucket) => {
        reactionMap.forEach((count, reaction_type) => {
          timelineData.push({
            time_bucket,
            reaction_type,
            count,
          });
        });
      });

      setTimeline(timelineData);

      // Calculate technical issues
      const technicalReactions = reactions.filter(
        (r) => r.reaction_type === 'cant_see' || r.reaction_type === 'no_audio'
      );

      const issuesByType = new Map<'cant_see' | 'no_audio', string[]>();

      technicalReactions.forEach((reaction) => {
        const type = reaction.reaction_type as 'cant_see' | 'no_audio';
        if (!issuesByType.has(type)) {
          issuesByType.set(type, []);
        }
        issuesByType.get(type)!.push(reaction.created_at);
      });

      const issues: TechnicalIssue[] = Array.from(issuesByType.entries()).map(
        ([reaction_type, timestamps]) => ({
          reaction_type,
          count: timestamps.length,
          first_reported: timestamps[0],
          last_reported: timestamps[timestamps.length - 1],
        })
      );

      setTechnicalIssues(issues);
    } catch (error) {
      console.error('Error fetching reaction analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (totalReactions === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-12 text-center">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No Reactions Yet
        </h3>
        <p className="text-gray-600">
          Reaction data will appear here after viewers start reacting during your
          live stream.
        </p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = prepareChartData(timeline);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Reactions */}
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-6 border border-pink-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-pink-500 rounded-full p-2">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-700">Total Reactions</h3>
          </div>
          <p className="text-3xl font-bold text-pink-600">{totalReactions}</p>
        </div>

        {/* Most Popular */}
        {breakdown.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-500 rounded-full p-2">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-700">Most Popular</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">
                {getReactionConfig(breakdown[0].reaction_type).emoji}
              </span>
              <div>
                <p className="font-bold text-green-600">
                  {breakdown[0].count} reactions
                </p>
                <p className="text-sm text-gray-600">
                  {getReactionConfig(breakdown[0].reaction_type).label}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Technical Issues */}
        <div
          className={`rounded-lg p-6 border ${
            technicalIssues.length > 0
              ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
              : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`rounded-full p-2 ${
                technicalIssues.length > 0 ? 'bg-red-500' : 'bg-blue-500'
              }`}
            >
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-700">Technical Issues</h3>
          </div>
          <p
            className={`text-3xl font-bold ${
              technicalIssues.length > 0 ? 'text-red-600' : 'text-blue-600'
            }`}
          >
            {technicalIssues.reduce((sum, issue) => sum + issue.count, 0)}
          </p>
          <p className="text-sm text-gray-600">
            {technicalIssues.length === 0 ? 'No issues reported' : 'Reports'}
          </p>
        </div>
      </div>

      {/* Reaction Breakdown */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-bold text-lg mb-4">Reaction Breakdown</h3>
        <div className="space-y-3">
          {breakdown.map((item) => {
            const config = getReactionConfig(item.reaction_type);
            return (
              <div key={item.reaction_type} className="flex items-center gap-4">
                <span className="text-3xl">{config.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-gray-600">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Graph */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-bold text-lg mb-4">Reaction Timeline</h3>
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Technical Issues Detail */}
      {technicalIssues.length > 0 && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
          <h3 className="font-bold text-lg mb-4 text-red-800">
            Technical Issues Reported
          </h3>
          <div className="space-y-4">
            {technicalIssues.map((issue) => {
              const config = getReactionConfig(issue.reaction_type);
              return (
                <div
                  key={issue.reaction_type}
                  className="bg-white rounded-lg p-4 border border-red-200"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{config.emoji}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800">
                        {config.label}
                      </h4>
                      <p className="text-sm text-gray-700 mt-1">
                        {issue.count} reports
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            First:{' '}
                            {new Date(issue.first_reported).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Last:{' '}
                            {new Date(issue.last_reported).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Prepare Chart.js data from timeline data
 */
function prepareChartData(timeline: ReactionTimelineData[]) {
  // Get unique timestamps
  const timestamps = Array.from(
    new Set(timeline.map((d) => d.time_bucket))
  ).sort();

  // Get unique reaction types
  const reactionTypes = Array.from(
    new Set(timeline.map((d) => d.reaction_type))
  );

  // Create datasets for each reaction type
  const datasets = reactionTypes.map((reactionType) => {
    const config = getReactionConfig(reactionType);
    const data = timestamps.map((timestamp) => {
      const item = timeline.find(
        (d) => d.time_bucket === timestamp && d.reaction_type === reactionType
      );
      return item ? item.count : 0;
    });

    // Color mapping
    const colorMap: Record<ReactionType, string> = {
      love_it: 'rgb(59, 130, 246)', // blue
      feeling_burn: 'rgb(239, 68, 68)', // red
      need_slower: 'rgb(251, 191, 36)', // amber
      cant_see: 'rgb(239, 68, 68)', // red
      no_audio: 'rgb(239, 68, 68)', // red
    };

    return {
      label: config.label,
      data,
      borderColor: colorMap[reactionType],
      backgroundColor: colorMap[reactionType] + '33', // 20% opacity
      tension: 0.3,
    };
  });

  return {
    labels: timestamps.map((ts) => {
      const date = new Date(ts);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }),
    datasets,
  };
}

/**
 * Chart.js options
 */
const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: false,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
      },
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
};

"use client";

import { WorkoutHistoryItem } from "@/types/database";
import { LiveStreamSession, StreamEnrollment } from "@/types/streaming";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Radio, Calendar, Dumbbell, Clock, Flame, Play } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { StreamCard } from "@/components/stream-card";
import Link from "next/link";

interface ActivityViewProps {
  workoutHistory: WorkoutHistoryItem[];
  upcomingStreams: LiveStreamSession[];
  liveStreams: LiveStreamSession[];
  pastStreams: LiveStreamSession[];
  enrollments: StreamEnrollment[];
  isAuthenticated: boolean;
}

export function ActivityView({
  workoutHistory,
  upcomingStreams,
  liveStreams,
  pastStreams,
  enrollments,
  isAuthenticated
}: ActivityViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Create enrollment map
  const enrollmentMap = new Map(enrollments.map((e) => [e.stream_id, e]));

  // Combine live and upcoming streams, limit to 3
  const featuredStreams = [...liveStreams, ...upcomingStreams].slice(0, 3);

  // Helper function to format duration from seconds to HH:MM:SS or MM:SS
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get month name
  const getMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Check if next month button should be disabled (can't go to future months)
  const isNextMonthDisabled = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(selectedDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth > now;
  }, [selectedDate]);

  // Filter workouts by selected month
  const filteredWorkouts = useMemo(() => {
    return workoutHistory.filter(session => {
      if (!session.workout_date) return false;
      const sessionDate = new Date(session.workout_date);
      return (
        sessionDate.getMonth() === selectedDate.getMonth() &&
        sessionDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [workoutHistory, selectedDate]);

  // Calculate stats for filtered workouts
  const stats = useMemo(() => {
    return {
      totalWorkouts: filteredWorkouts.length,
      totalDuration: filteredWorkouts.reduce((total, session) => total + session.duration_seconds, 0),
    };
  }, [filteredWorkouts]);

  // Current consistency streak (consecutive days with a session, all-time).
  // Web's value metric is consistency, not calories (calories need weight,
  // which is only tracked in the iOS app).
  const currentStreak = useMemo(() => {
    const days = new Set(
      workoutHistory
        .filter((s) => s.workout_date)
        .map((s) => new Date(s.workout_date!).toDateString())
    );
    if (days.size === 0) return 0;
    const cursor = new Date();
    if (!days.has(cursor.toDateString())) {
      cursor.setDate(cursor.getDate() - 1);
      if (!days.has(cursor.toDateString())) return 0; // last activity > 1 day ago
    }
    let streak = 0;
    while (days.has(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [workoutHistory]);

  return (
    <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8 px-4 py-6 sm:py-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-light text-gray-900 mb-2">Activity</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Your workout history and progress</p>
      </div>

      {/* Live Streams Section */}
      {featuredStreams.length > 0 && (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 sm:p-6 border border-pink-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
                {liveStreams.length > 0 && (
                  <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 animate-pulse" />
                )}
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
                Join Live Classes
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Connect with instructors in real-time dance workouts
              </p>
            </div>
            <Link href="/streams" className="self-start sm:self-auto">
              <Button variant="outline" size="sm" className="border-pink-300 text-pink-600 hover:bg-pink-100 text-xs sm:text-sm">
                View All Streams
              </Button>
            </Link>
          </div>
          <div className="grid gap-4">
            {featuredStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                enrollment={enrollmentMap.get(stream.id)}
                isLive={stream.status === "live"}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Classes Section */}
      {pastStreams.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border border-purple-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Past Classes
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Replay your enrolled classes anytime within 7 days
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            {pastStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                enrollment={enrollmentMap.get(stream.id)}
                isLive={false}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </div>
      )}

      {/* Month nav + stats only once there's any history */}
      {workoutHistory.length > 0 && (
      <>
      {/* Month Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousMonth}
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </Button>
        <h2 className="text-base sm:text-xl font-semibold text-center">{getMonthYear(selectedDate)}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextMonth}
          disabled={isNextMonthDisabled}
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <span className="sm:hidden">Next</span>
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-2 text-pink-600">
            <Dumbbell className="h-4 w-4" />
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Sessions this month</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{stats.totalWorkouts}</p>
        </div>
        <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-2 text-pink-600">
            <Clock className="h-4 w-4" />
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Time moving</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{formatDuration(stats.totalDuration)}</p>
        </div>
        <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-2 text-pink-600">
            <Flame className="h-4 w-4" />
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Day streak</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">
            {currentStreak} {currentStreak === 1 ? "day" : "days"}
          </p>
        </div>
      </div>
      </>
      )}

      {/* Workout History Table */}
      {workoutHistory.length === 0 ? (
        <EmptyState
          title="No sessions yet — your progress will show up here."
          action={
            <Link
              href="/my-program"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-pink-200/50"
            >
              <Play className="h-4 w-4" /> Start Day 1
            </Link>
          }
        />
      ) : filteredWorkouts.length === 0 ? (
        <EmptyState
          title={`No workout sessions in ${getMonthYear(selectedDate)}.`}
          description="Try a different month, or jump back into your program."
        />
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full border-collapse min-w-[640px] sm:min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Date</th>
                <th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Workout</th>
                <th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Duration</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkouts.map((session) => (
                <tr key={session.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">
                    {formatDate(session.workout_date)}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                    {session.workouts?.title || 'Unknown Workout'}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">
                    {formatDuration(session.duration_seconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

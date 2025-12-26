"use client";

import { WorkoutHistoryItem } from "@/types/database";
import { LiveStreamSession, StreamEnrollment } from "@/types/streaming";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Radio, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StreamCard } from "@/components/stream-card";
import Link from "next/link";

interface ActivityViewProps {
  workoutHistory: WorkoutHistoryItem[];
  upcomingStreams: LiveStreamSession[];
  liveStreams: LiveStreamSession[];
  enrollments: StreamEnrollment[];
  isAuthenticated: boolean;
}

export function ActivityView({
  workoutHistory,
  upcomingStreams,
  liveStreams,
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
      totalCalories: filteredWorkouts.reduce((total, session) => total + (session.calories_burned || 0), 0),
    };
  }, [filteredWorkouts]);

  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 py-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">Activity</h1>
        <p className="text-muted-foreground">Your workout history and progress</p>
      </div>

      {/* Live Streams Section */}
      {featuredStreams.length > 0 && (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {liveStreams.length > 0 && (
                  <Radio className="w-6 h-6 text-red-500 animate-pulse" />
                )}
                <Calendar className="w-6 h-6 text-pink-500" />
                Join Live Classes
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Connect with instructors in real-time dance workouts
              </p>
            </div>
            <Link href="/streams">
              <Button variant="outline" size="sm" className="border-pink-300 text-pink-600 hover:bg-pink-100">
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

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousMonth}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <h2 className="text-xl font-semibold">{getMonthYear(selectedDate)}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextMonth}
          disabled={isNextMonthDisabled}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-muted rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Workouts</h3>
          <p className="text-3xl font-bold">{stats.totalWorkouts}</p>
        </div>
        <div className="bg-muted rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Duration</h3>
          <p className="text-3xl font-bold">{formatDuration(stats.totalDuration)}</p>
        </div>
        <div className="bg-muted rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Calories</h3>
          <p className="text-3xl font-bold">{stats.totalCalories} kcal</p>
        </div>
      </div>

      {/* Workout History Table */}
      {filteredWorkouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No workout sessions in {getMonthYear(selectedDate)}.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Start your first workout to see your activity here!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold">Date</th>
                <th className="text-left py-4 px-4 font-semibold">Workout</th>
                <th className="text-left py-4 px-4 font-semibold">Duration</th>
                <th className="text-left py-4 px-4 font-semibold">Calories Burned</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkouts.map((session) => (
                <tr key={session.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-4">
                    {formatDate(session.workout_date)}
                  </td>
                  <td className="py-4 px-4 font-medium">
                    {session.workouts?.title || 'Unknown Workout'}
                  </td>
                  <td className="py-4 px-4">
                    {formatDuration(session.duration_seconds)}
                  </td>
                  <td className="py-4 px-4">
                    {session.calories_burned || 0} kcal
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

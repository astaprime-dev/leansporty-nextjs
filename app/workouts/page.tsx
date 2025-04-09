// app/gallery/page.tsx
'use client';

import { useState } from 'react';
import VideoPlayer from '../../components/VideoPlayer';

type VideoItem = {
  title: string;
  playbackId: string;
  duration: string;
  level: string;
  style: string;
  focus: string;
  energy: string;
  categories: string[];
};


const videos = [
  {
    title: "Full Body Warm-Up",
    playbackId: "mux_playback_id_1",
    duration: "5 min",
    level: "Beginner",
    style: "Gentle Warm-Up",
    focus: "Loosen the body",
    energy: "Low",
    categories: ["Quick Workouts", "Beginner Workouts"],
  },
  {
    title: "Beginner Dance Cardio - Latin Style",
    playbackId: "mux_playback_id_2",
    duration: "15 min",
    level: "Beginner",
    style: "Latin",
    focus: "Light intensity cardio",
    energy: "Medium",
    categories: ["Beginner Workouts", "Full-Body Dance Workouts"],
  },
  {
    title: "Dance & Stretch",
    playbackId: "mux_playback_id_3",
    duration: "10 min",
    level: "Beginner",
    style: "Stretch",
    focus: "Flexibility",
    energy: "Low",
    categories: ["Quick Workouts", "Beginner Workouts", "Targeted Workouts"],
  },
  {
    title: "Step-by-Step Groove Tutorial",
    playbackId: "mux_playback_id_4",
    duration: "10 min",
    level: "Beginner",
    style: "Groove",
    focus: "Step learning",
    energy: "Low",
    categories: ["Quick Workouts", "Beginner Workouts"],
  },
  {
    title: "Low Impact Happy Dance",
    playbackId: "mux_playback_id_5",
    duration: "15 min",
    level: "Beginner",
    style: "Uplifting",
    focus: "Joint-friendly cardio",
    energy: "Medium",
    categories: ["Beginner Workouts", "Full-Body Dance Workouts"],
  },
  {
    title: "Hip-Hop Inspired Workout",
    playbackId: "mux_playback_id_6",
    duration: "20 min",
    level: "Intermediate",
    style: "Hip-Hop",
    focus: "Cardio",
    energy: "High",
    categories: ["Full-Body Dance Workouts", "Longer Sessions"],
  },
  {
    title: "Body Sculpt Dance Fusion",
    playbackId: "mux_playback_id_7",
    duration: "20 min",
    level: "Intermediate",
    style: "Dance + Strength",
    focus: "Sculpting",
    energy: "Medium-High",
    categories: ["Targeted Workouts", "Longer Sessions"],
  },
  {
    title: "Retro Dance Party",
    playbackId: "mux_playback_id_8",
    duration: "20 min",
    level: "Intermediate",
    style: "80s/90s",
    focus: "Fun cardio",
    energy: "Medium",
    categories: ["Full-Body Dance Workouts", "Longer Sessions"],
  },
  {
    title: "Salsa Burn",
    playbackId: "mux_playback_id_9",
    duration: "15 min",
    level: "Intermediate",
    style: "Salsa",
    focus: "Core and rhythm",
    energy: "High",
    categories: ["Targeted Workouts", "Full-Body Dance Workouts"],
  },
  {
    title: "Afrobeat Vibes",
    playbackId: "mux_playback_id_10",
    duration: "20 min",
    level: "Intermediate",
    style: "Afrobeat",
    focus: "Legs and rhythm",
    energy: "High",
    categories: ["Targeted Workouts", "Full-Body Dance Workouts", "Longer Sessions"],
  },
  {
    title: "Cardio Dance Intervals",
    playbackId: "mux_playback_id_11",
    duration: "20 min",
    level: "Intermediate",
    style: "Interval Training",
    focus: "Heart rate variability",
    energy: "Medium-High",
    categories: ["Full-Body Dance Workouts", "Longer Sessions"],
  },
  {
    title: "Power Moves Dance HIIT",
    playbackId: "mux_playback_id_12",
    duration: "20 min",
    level: "Advanced",
    style: "HIIT",
    focus: "Intense cardio",
    energy: "High",
    categories: ["Full-Body Dance Workouts", "Longer Sessions"],
  },
  {
    title: "Fast-Paced Choreo Challenge",
    playbackId: "mux_playback_id_13",
    duration: "15 min",
    level: "Advanced",
    style: "Choreography",
    focus: "Memory + speed",
    energy: "High",
    categories: ["Full-Body Dance Workouts"],
  },
  {
    title: "Full Body Burnout",
    playbackId: "mux_playback_id_14",
    duration: "25 min",
    level: "Advanced",
    style: "Strength + Cardio",
    focus: "Endurance",
    energy: "Very High",
    categories: ["Full-Body Dance Workouts", "Longer Sessions"],
  },
  {
    title: "Freestyle Dance Jam",
    playbackId: "mux_playback_id_15",
    duration: "20 min",
    level: "Advanced",
    style: "Freestyle",
    focus: "Flow + Expression",
    energy: "Medium-High",
    categories: ["Full-Body Dance Workouts", "Longer Sessions"],
  },
];


// app/gallery/page.tsx

const gradientPresets = [
  "from-rose-400 to-pink-300",
  "from-fuchsia-500 to-rose-400",
  "from-purple-400 to-indigo-300",
  "from-pink-400 to-amber-200",
  "from-cyan-300 to-blue-400",
];


const levels = ['Beginner', 'Intermediate', 'Advanced'];
const energies = ['Low', 'Medium', 'Medium-High', 'High', 'Very High'];

export default function DanceGallery() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);

  const filteredVideos = videos.filter(video => {
    const levelMatch = !selectedLevel || video.level === selectedLevel;
    const energyMatch = !selectedEnergy || video.energy === selectedEnergy;
    return levelMatch && energyMatch;
  });

  return (
    <section className="pt-22 pb-28 px-6 bg-white min-w-full lg:min-w-[1024px]">


      <div className="w-full max-w-7xl mx-auto text-left seelf-left">
        <h1 className="text-6xl font-extrabold text-center mb-12 tracking-tight text-gray-900">
          Workouts
        </h1>

        {/* ✅ STEP 1: FILTER UI */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4 flex-wrap">
            {levels.map(level => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-full border ${
                  selectedLevel === level ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {level}
              </button>
            ))}
            <button
              onClick={() => setSelectedLevel(null)}
              className="px-4 py-2 rounded-full bg-gray-200 text-gray-600"
            >
              Clear Level
            </button>
          </div>

          <div className="flex gap-4 flex-wrap">
            {energies.map(energy => (
              <button
                key={energy}
                onClick={() => setSelectedEnergy(energy)}
                className={`px-4 py-2 rounded-full border ${
                  selectedEnergy === energy ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {energy}
              </button>
            ))}
            <button
              onClick={() => setSelectedEnergy(null)}
              className="px-4 py-2 rounded-full bg-gray-200 text-gray-600"
            >
              Clear Energy
            </button>
          </div>
        </div>

        {/* ✅ STEP 2: FILTERED VIDEO GRID */}
        <div className="space-y-20">
          {filteredVideos.map((video, idx) => (
            <div key={idx} className="flex flex-col lg:flex-row lg:gap-10">
              <VideoPlayer
                playbackId={video.playbackId}
                title={video.title}
                duration={video.duration}
                gradientClass={gradientPresets[idx % gradientPresets.length]}
              />
              <div className="mt-6 lg:mt-0 lg:w-1/2 text-gray-800 space-y-2 text-lg">
                <div><strong>Level:</strong> {video.level}</div>
                <div><strong>Style:</strong> {video.style}</div>
                <div><strong>Focus:</strong> {video.focus}</div>
                <div><strong>Energy:</strong> {video.energy}</div>
                <div><strong>Categories:</strong> {video.categories.join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

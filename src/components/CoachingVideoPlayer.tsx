"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle2,
  Clock,
  Dumbbell,
  ChefHat,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Flame,
  Layers,
  Award,
} from "lucide-react";

export interface CoachingVideo {
  id: string;
  category: "workout" | "nutrition" | "mindset";
  title: string;
  coach: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
  description: string;
  targetMuscles?: string[];
  equipmentNeeded?: string[];
  formCues: string[];
  chapters: { title: string; timestamp: string; seconds: number }[];
}

const COACHING_LIBRARY: CoachingVideo[] = [
  {
    id: "video-1",
    category: "workout",
    title: "Park Kettlebell Deadlift & Hinge Mechanics",
    coach: "Coach Esh",
    duration: "4:15",
    thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Reliable fallback video stream
    description: "Master the hip-hinge pattern to protect your lower back and maximize glute/hamstring tension during outdoor park sessions.",
    targetMuscles: ["Glutes", "Hamstrings", "Erector Spinae", "Latissimus Dorsi"],
    equipmentNeeded: ["Single Kettlebell (16kg - 24kg)", "Flat Ground"],
    formCues: [
      "Keep feet hip-width apart with weight distributed across mid-foot and heel.",
      "Engage your lats by squeezing shoulder blades down into your back pockets.",
      "Hinge hips straight backward before bending at the knees.",
      "Exhale forcefully as you drive the hips forward into lock-out without arching the lower back.",
    ],
    chapters: [
      { title: "Setup & Stance Alignment", timestamp: "0:00", seconds: 0 },
      { title: "Lat Engagement & Spine Neutrality", timestamp: "1:15", seconds: 75 },
      { title: "The Concentric Hip Drive", timestamp: "2:30", seconds: 150 },
      { title: "Common Mistakes & Troubleshooting", timestamp: "3:20", seconds: 200 },
    ],
  },
  {
    id: "video-2",
    category: "workout",
    title: "Bodyweight Push-Up Progression & Scapular Control",
    coach: "Coach Esh",
    duration: "3:45",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "Develop upper-body pressing power and shoulder longevity using progressive incline scaling and full range-of-motion pauses.",
    targetMuscles: ["Pectoralis Major", "Triceps", "Anterior Deltoids", "Core"],
    equipmentNeeded: ["Park Bench or Incline Surface", "Exercise Mat"],
    formCues: [
      "Position hands slightly wider than shoulder-width with fingers spread.",
      "Tuck elbows at a 45-degree angle to the torso rather than flaring out.",
      "Maintain a rigid plank line from crown of head to heels throughout.",
      "Lower until chest lightly contacts the floor or bench, pause for 1 second, then push away.",
    ],
    chapters: [
      { title: "Hand Placement & Shoulder Torque", timestamp: "0:00", seconds: 0 },
      { title: "Core Bracing & Pelvic Tilt", timestamp: "1:00", seconds: 60 },
      { title: "Eccentric Control & Pause Reps", timestamp: "2:10", seconds: 130 },
      { title: "Regressions: Park Bench Incline", timestamp: "3:00", seconds: 180 },
    ],
  },
  {
    id: "video-3",
    category: "nutrition",
    title: "Sunday Macro Meal Prep Masterclass",
    coach: "Coach Esh",
    duration: "5:30",
    thumbnailUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    description: "How to prep 10 high-protein, calorie-controlled meals in 45 minutes using bulk marinades and sheet-pan roasting.",
    targetMuscles: ["Recovery & Lean Mass Synthesis"],
    equipmentNeeded: ["Sheet Pans", "Digital Food Scale", "Glass Meal Prep Containers"],
    formCues: [
      "Weigh protein sources raw before cooking for accurate macro calculation.",
      "Batch roast complex carbs (jasmine rice, sweet potatoes) in 3-day portions.",
      "Separate fresh crisp veggies from hot ingredients to maintain texture.",
      "Label each container with total protein, carbs, and fat for effortless tracking.",
    ],
    chapters: [
      { title: "Batch Seasoning & Marinades", timestamp: "0:00", seconds: 0 },
      { title: "Sheet-Pan High Heat Roasting", timestamp: "1:45", seconds: 105 },
      { title: "Digital Scale Portioning Protocol", timestamp: "3:15", seconds: 195 },
      { title: "Storage & Freshness Longevity", timestamp: "4:30", seconds: 270 },
    ],
  },
];

export default function CoachingVideoPlayer({
  className = "",
}: {
  className?: string;
}) {
  const [selectedVideo, setSelectedVideo] = useState<CoachingVideo>(COACHING_LIBRARY[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "workout" | "nutrition">("all");
  const [activeCueIdx, setActiveCueIdx] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const jumpToTimestamp = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    if (!isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const filteredVideos = COACHING_LIBRARY.filter(
    (v) => activeCategory === "all" || v.category === activeCategory
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── Hub Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/5 bg-charcoal-gray/40">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-lime mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mastery Video Coaching Studio</span>
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-ice-white">
            Exercise Technique & Culinary Prep
          </h2>
          <p className="text-silver-slate text-xs mt-1">
            Official coaching tutorials, bio-mechanical form cues, and nutrition protocols from Coach Esh.
          </p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 text-xs self-start sm:self-auto">
          {(["all", "workout", "nutrition"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl capitalize font-semibold transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-accent-lime text-obsidian-black shadow-lg"
                  : "text-silver-slate hover:text-ice-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Video Player & Cue Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Video Screen & Chapter Control */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden bg-black relative shadow-2xl">
            <div className="relative aspect-video w-full bg-charcoal-gray/80 overflow-hidden">
              <video
                ref={videoRef}
                src={selectedVideo.videoUrl}
                poster={selectedVideo.thumbnailUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Custom Control Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-4 pointer-events-none">
                <div className="flex items-center justify-between pointer-events-auto">
                  <span className="px-3 py-1 rounded-xl bg-obsidian-black/80 backdrop-blur-md border border-accent-lime/30 text-accent-lime text-xs font-bold">
                    {selectedVideo.coach}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-obsidian-black/80 backdrop-blur-md border border-white/20 text-silver-slate text-xs font-semibold">
                    {selectedVideo.duration}
                  </span>
                </div>

                <div className="flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="w-11 h-11 rounded-2xl bg-accent-lime text-obsidian-black flex items-center justify-center font-bold hover:scale-105 transition-all shadow-xl cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-obsidian-black" /> : <Play className="w-5 h-5 fill-obsidian-black ml-0.5" />}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-ice-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="text-xs font-bold text-ice-white tracking-wide truncate max-w-xs sm:max-w-md">
                    {selectedVideo.title}
                  </div>
                </div>
              </div>
            </div>

            {/* Chapters Bar */}
            <div className="p-4 bg-charcoal-gray/60 border-t border-white/5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-silver-slate mb-2">
                Video Chapters & Key Sections
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedVideo.chapters.map((ch, idx) => (
                  <button
                    key={idx}
                    onClick={() => jumpToTimestamp(ch.seconds)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-accent-lime/10 border border-white/5 hover:border-accent-lime/30 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[10px] font-bold text-accent-lime group-hover:underline">
                      {ch.timestamp}
                    </div>
                    <div className="text-xs text-silver-slate group-hover:text-ice-white truncate font-medium mt-0.5">
                      {ch.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description & Target Attributes */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-charcoal-gray/30 space-y-4">
            <h3 className="font-display font-bold text-xl text-ice-white">{selectedVideo.title}</h3>
            <p className="text-sm text-silver-slate leading-relaxed">{selectedVideo.description}</p>

            <div className="flex flex-wrap gap-4 pt-2 border-t border-white/5">
              {selectedVideo.targetMuscles && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-silver-slate block mb-1.5">
                    Target Muscles & Systems
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVideo.targetMuscles.map((m, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-accent-lime/10 border border-accent-lime/20 text-accent-lime text-xs font-medium"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedVideo.equipmentNeeded && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-silver-slate block mb-1.5">
                    Equipment Recommended
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVideo.equipmentNeeded.map((eq, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-silver-slate text-xs font-medium"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Cues Checklist & Library Rail */}
        <div className="lg:col-span-4 space-y-6">
          {/* Key Form Checklist */}
          <div className="glass-panel p-6 rounded-3xl border border-accent-lime/20 bg-charcoal-gray/30 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
              <div className="w-8 h-8 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-base text-ice-white">Coach Esh Execution Cues</h4>
            </div>

            <div className="space-y-2.5">
              {selectedVideo.formCues.map((cue, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveCueIdx(activeCueIdx === idx ? null : idx)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    activeCueIdx === idx
                      ? "bg-accent-lime/10 border-accent-lime/40 text-ice-white shadow-lg"
                      : "bg-white/5 border-white/5 text-silver-slate hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-accent-lime text-obsidian-black flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs leading-relaxed">{cue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coaching Library Rail */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-charcoal-gray/30 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-silver-slate">
                Related Coaching Masterclasses
              </span>
              <span className="text-xs text-accent-lime font-semibold">{filteredVideos.length} Available</span>
            </div>

            <div className="space-y-2">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => {
                    setSelectedVideo(video);
                    setIsPlaying(false);
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedVideo.id === video.id
                      ? "bg-accent-lime/10 border-accent-lime/40"
                      : "bg-white/5 border-white/5 hover:border-white/20"
                  }`}
                >
                  <div
                    className="w-16 h-12 rounded-xl bg-cover bg-center shrink-0 border border-white/10"
                    style={{ backgroundImage: `url('${video.thumbnailUrl}')` }}
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-ice-white truncate">{video.title}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-silver-slate mt-0.5">
                      <span>{video.duration}</span>
                      <span>•</span>
                      <span className="capitalize text-accent-lime">{video.category}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-silver-slate shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

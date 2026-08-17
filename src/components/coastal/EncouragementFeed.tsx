"use client";

import React, { useState } from "react";
import {
  HeartHandshake,
  Flame,
  Heart,
  Crown,
  Zap,
  Send,
  MessageSquare,
  Filter,
  Check,
  User,
  Sparkles,
  Share2,
  RefreshCw,
  EyeOff,
  Eye,
  Clock,
  Shield,
  Tag,
} from "lucide-react";
import { CommunityEncouragement } from "@/types/coastal";
import { postEncouragement, toggleReaction } from "@/lib/coastal/db";

interface EncouragementFeedProps {
  initialPosts?: CommunityEncouragement[];
  userId?: string;
  userDisplayName?: string;
  groupId?: string;
  onPostCreated?: (post: CommunityEncouragement) => void;
  className?: string;
}

const DEFAULT_POSTS: CommunityEncouragement[] = [
  {
    id: "enc-1",
    group_id: "3266-coastal-church",
    user_id: "user-pastor-mark",
    display_name: "Pastor Mark",
    message:
      "Blessed Sunday church family! Remember that every step today is an act of worship and stewardship for the temple God entrusted to you. Let's hit our 50k Jericho milestone this week!",
    prayer_tag: "Praise & Encouragement",
    reactions: { prayer: 14, heart: 9, fire: 12, crown: 5 },
    user_reactions: ["prayer", "fire"],
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "enc-2",
    group_id: "3266-coastal-church",
    user_id: "user-sarah-m",
    display_name: "Sarah M.",
    message:
      "Just wrapped up a 4-mile sunrise prayer walk by the coastline. Praying for all our families navigating tough seasons right now. Keep moving forward in steadfast faith!",
    prayer_tag: "Prayer Request",
    reactions: { prayer: 19, heart: 11, fire: 8, crown: 3 },
    user_reactions: ["heart"],
    created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    id: "enc-3",
    group_id: "3266-coastal-church",
    user_id: "user-david-k",
    display_name: "David K.",
    message:
      "Hit 10,000 steps 5 days in a row! Never felt more focused for morning prayer and scripture meditation. Spurring one another on toward love and good deeds!",
    prayer_tag: "Milestone Shoutout",
    reactions: { prayer: 8, heart: 6, fire: 15, crown: 4 },
    user_reactions: ["fire"],
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: "enc-4",
    group_id: "3266-coastal-church",
    user_id: "user-elena-r",
    display_name: "Elena Rostova",
    message:
      "Today's devotional on 'The Lighted Path' (Psalm 119:105) spoke right to my heart. One step at a time, trusting the Lord's timing.",
    prayer_tag: "Scripture Reflection",
    reactions: { prayer: 11, heart: 14, fire: 5, crown: 2 },
    user_reactions: ["prayer", "heart"],
    created_at: new Date(Date.now() - 3600000 * 22).toISOString(),
  },
];

const PRAYER_TAGS = [
  "Praise & Encouragement",
  "Prayer Request",
  "Milestone Shoutout",
  "Scripture Reflection",
  "Walking Partner",
] as const;

// Helper to format relative time strings (strictly zero emojis)
function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  } catch {
    return "Recently";
  }
}

export default function EncouragementFeed({
  initialPosts = DEFAULT_POSTS,
  userId = "guest-user",
  userDisplayName = "Faithful Walker",
  groupId = "3266-coastal-church",
  onPostCreated,
  className = "",
}: EncouragementFeedProps) {
  const [posts, setPosts] = useState<CommunityEncouragement[]>(initialPosts);
  const [filterTag, setFilterTag] = useState<string>("All");

  // Post Creator State
  const [message, setMessage] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("Praise & Encouragement");
  const [postAsAnonymous, setPostAsAnonymous] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Handle Reaction Toggle
  const handleToggleReaction = async (
    postId: string,
    reactionType: "prayer" | "heart" | "fire" | "crown" | "high_five"
  ) => {
    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;

        const currentActive = post.user_reactions || [];
        const isCurrentlyActive = currentActive.includes(reactionType);
        const nextActive = isCurrentlyActive
          ? currentActive.filter((r) => r !== reactionType)
          : [...currentActive, reactionType];

        const currentCount = post.reactions?.[reactionType] || 0;
        const nextCount = isCurrentlyActive
          ? Math.max(0, currentCount - 1)
          : currentCount + 1;

        return {
          ...post,
          reactions: {
            ...post.reactions,
            [reactionType]: nextCount,
          },
          user_reactions: nextActive,
        };
      })
    );

    // Call service layer / Supabase
    try {
      await toggleReaction(postId, userId, reactionType);
    } catch {
      // Optimistic state remains in local session
    }
  };

  // Handle New Post Submission
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const authorName = postAsAnonymous ? "Faithful Walker" : userDisplayName;

    try {
      const res = await postEncouragement({
        userId,
        groupId,
        displayName: authorName,
        message: message.trim(),
        prayerTag: selectedTag,
      });

      if (res.success && res.post) {
        setPosts((prev) => [res.post!, ...prev]);
        setMessage("");
        if (onPostCreated) {
          onPostCreated(res.post);
        }
      }
    } catch {
      // Local fallback insertion
      const localPost: CommunityEncouragement = {
        id: `local-post-${Date.now()}`,
        group_id: groupId,
        user_id: userId,
        display_name: authorName,
        message: message.trim(),
        prayer_tag: selectedTag,
        reactions: { prayer: 1 },
        user_reactions: ["prayer"],
        created_at: new Date().toISOString(),
      };
      setPosts((prev) => [localPost, ...prev]);
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Copy Post Message
  const handleCopyPost = async (post: CommunityEncouragement) => {
    try {
      await navigator.clipboard.writeText(
        `"${post.message}"\n— ${post.display_name} (Coastal Community Church Faith & Fitness)`
      );
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2500);
    } catch {
      // Fallback
    }
  };

  // Filtered posts list
  const filteredPosts = posts.filter((p) => {
    if (filterTag === "All") return true;
    if (filterTag === "Prayers") return p.prayer_tag === "Prayer Request";
    if (filterTag === "Milestones") return p.prayer_tag === "Milestone Shoutout";
    if (filterTag === "Reflections") return p.prayer_tag === "Scripture Reflection";
    return p.prayer_tag === filterTag;
  });

  return (
    <div
      className={`glass-panel border border-white/10 rounded-2xl p-5 sm:p-7 md:p-8 bg-onyx-card/85 relative overflow-hidden ${className}`}
      data-testid="coastal-encouragement-feed"
    >
      {/* Subtle Ambient Light */}
      <div
        className="absolute top-10 left-10 w-72 h-72 bg-accent-lime/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-lime/10 border border-accent-lime/20 flex items-center justify-center text-accent-lime">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-accent-lime font-display">
                Faith & Fellowship
              </span>
              <span className="text-white/20">•</span>
              <span className="text-[11px] font-medium text-silver-slate">
                Group #3266
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-ice-white">
              Encouragement & Prayer Wall
            </h2>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
          {["All", "Prayers", "Milestones", "Reflections"].map((tag) => (
            <button
              key={`filter-${tag}`}
              type="button"
              onClick={() => setFilterTag(tag)}
              className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-target ${
                filterTag === tag
                  ? "bg-accent-lime text-cyber-slate font-bold shadow-sm"
                  : "bg-white/5 text-silver-slate hover:text-ice-white hover:bg-white/10"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Post Creator Box */}
      <form
        onSubmit={handleSubmitPost}
        className="my-6 p-4 sm:p-5 rounded-xl bg-cyber-slate/90 border border-white/5 space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-silver-slate font-semibold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5 text-accent-lime" />
            <span>Share a Prayer, Praise, or Step Shout-Out</span>
          </div>

          <button
            type="button"
            onClick={() => setPostAsAnonymous(!postAsAnonymous)}
            className={`text-xs flex items-center gap-1.5 transition-colors ${
              postAsAnonymous
                ? "text-accent-lime font-bold"
                : "text-silver-slate hover:text-ice-white"
            }`}
          >
            {postAsAnonymous ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Posting Anonymously</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Posting as {userDisplayName}</span>
              </>
            )}
          </button>
        </div>

        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type an uplifting note, walking celebration, or prayer request for our Coastal walking group..."
          maxLength={1000}
          className="w-full bg-onyx-card border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-ice-white placeholder:text-silver-slate/40 focus:border-accent-lime focus:outline-none focus:ring-1 focus:ring-accent-lime resize-y min-h-[80px] transition-all"
        />

        {/* Tag Selector & Submit Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Category Tag Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
            <span className="text-[11px] text-silver-slate flex items-center gap-1 mr-1 shrink-0">
              <Tag className="w-3 h-3 text-accent-lime" />
              <span>Category:</span>
            </span>
            {PRAYER_TAGS.map((tag) => (
              <button
                key={`select-tag-${tag}`}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedTag === tag
                    ? "bg-accent-lime/20 text-accent-lime border border-accent-lime/40"
                    : "bg-white/5 text-silver-slate hover:text-ice-white hover:bg-white/10 border border-white/5"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="self-end sm:self-auto shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-accent-lime hover:bg-accent-lime/90 disabled:opacity-40 disabled:cursor-not-allowed text-cyber-slate transition-all flex items-center gap-2 shadow-sm shadow-accent-lime/10 touch-target"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Post Note</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Encouragement Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="py-12 text-center text-xs text-silver-slate">
            No encouragement notes yet in this category. Be the first to share!
          </div>
        ) : (
          filteredPosts.map((post) => {
            const userReactions = post.user_reactions || [];
            const hasPrayer = userReactions.includes("prayer");
            const hasHeart = userReactions.includes("heart");
            const hasFire = userReactions.includes("fire");
            const hasCrown = userReactions.includes("crown");

            return (
              <div
                key={`post-${post.id}`}
                className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all space-y-3"
              >
                {/* Author & Tag Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent-lime/10 border border-accent-lime/20 flex items-center justify-center text-accent-lime shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-ice-white font-display">
                          {post.display_name}
                        </span>
                        {post.prayer_tag && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-lime/10 text-accent-lime border border-accent-lime/20">
                            {post.prayer_tag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-silver-slate/70">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(post.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyPost(post)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-silver-slate hover:text-ice-white transition-all touch-target"
                    title="Copy note"
                    aria-label="Copy note"
                  >
                    {copiedPostId === post.id ? (
                      <Check className="w-3.5 h-3.5 text-accent-lime" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Message Body */}
                <p className="text-xs sm:text-sm text-silver-slate leading-relaxed whitespace-pre-line pl-10">
                  {post.message}
                </p>

                {/* SVG Reaction Buttons (Strictly ZERO emojis) */}
                <div className="pl-10 pt-2 flex flex-wrap items-center gap-2">
                  {/* Reaction 1: Praying (HeartHandshake / Sparkles) */}
                  <button
                    type="button"
                    onClick={() => handleToggleReaction(post.id, "prayer")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 touch-target ${
                      hasPrayer
                        ? "bg-accent-lime/20 text-accent-lime border border-accent-lime/40 font-bold"
                        : "bg-white/5 text-silver-slate hover:text-ice-white hover:bg-white/10 border border-white/5"
                    }`}
                    title="Praying With You"
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>Praying</span>
                    <span className="font-mono text-[11px]">
                      {post.reactions?.prayer || 0}
                    </span>
                  </button>

                  {/* Reaction 2: Heart (Love & Support) */}
                  <button
                    type="button"
                    onClick={() => handleToggleReaction(post.id, "heart")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 touch-target ${
                      hasHeart
                        ? "bg-accent-violet/20 text-accent-violet border border-accent-violet/40 font-bold"
                        : "bg-white/5 text-silver-slate hover:text-ice-white hover:bg-white/10 border border-white/5"
                    }`}
                    title="Heart / Encouragement"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Love</span>
                    <span className="font-mono text-[11px]">
                      {post.reactions?.heart || 0}
                    </span>
                  </button>

                  {/* Reaction 3: Flame (Energy / Holy Zeal) */}
                  <button
                    type="button"
                    onClick={() => handleToggleReaction(post.id, "fire")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 touch-target ${
                      hasFire
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold"
                        : "bg-white/5 text-silver-slate hover:text-ice-white hover:bg-white/10 border border-white/5"
                    }`}
                    title="Energy & Endurance"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Zeal</span>
                    <span className="font-mono text-[11px]">
                      {post.reactions?.fire || 0}
                    </span>
                  </button>

                  {/* Reaction 4: Crown (Kingdom Praise / Victory) */}
                  <button
                    type="button"
                    onClick={() => handleToggleReaction(post.id, "crown")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 touch-target ${
                      hasCrown
                        ? "bg-accent-lime/20 text-accent-lime border border-accent-lime/40 font-bold"
                        : "bg-white/5 text-silver-slate hover:text-ice-white hover:bg-white/10 border border-white/5"
                    }`}
                    title="Kingdom Victory"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Victory</span>
                    <span className="font-mono text-[11px]">
                      {post.reactions?.crown || 0}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

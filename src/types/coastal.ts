/**
 * Coastal Community Church (#3266) Faith & Fitness Walking and Step Tracker
 * Shared TypeScript Domain Models & Interfaces
 *
 * Strictly zero emojis. Icons are referenced by Lucide React icon name strings.
 */

export interface WalkingGroup {
  id: string;
  slug: string;
  name: string;
  group_number: string;
  church_name?: string;
  description: string;
  target_steps: number;
  target_miles: number;
  banner_url?: string | null;
  accent_color?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export type Group = WalkingGroup;

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  role: 'member' | 'leader' | 'admin';
  avatar_url?: string | null;
  campus?: string;
  daily_step_goal?: number;
  is_anonymous: boolean;
  joined_at: string;
  updated_at?: string;
}

export interface StepLog {
  id: string;
  user_id: string;
  group_id: string;
  log_date: string; // YYYY-MM-DD
  steps: number;
  distance_miles: number;
  active_minutes: number;
  calories_burned?: number;
  source?: 'manual' | 'apple_health' | 'google_fit' | 'fitbit';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FaithDevotional {
  id: string;
  day_number: number;
  title: string;
  scripture_ref: string;
  scripture_text: string;
  theme: string;
  reflection_prompt: string;
  prayer_focus: string;
  walking_action: string;
  group_id?: string | null;
  date_applicable?: string | null;
  created_at?: string;
}

export interface DevotionalReflection {
  id: string;
  user_id: string;
  group_id?: string;
  devotional_id: string;
  day_number?: number;
  reflection_text: string;
  prayer_request?: string | null;
  is_shared_to_feed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMilestone {
  id: string;
  group_id: string;
  title: string;
  target_steps: number;
  target_miles: number;
  description: string;
  scripture_theme: string;
  icon_name?: string;
  is_reached: boolean;
  unlocked_at?: string | null;
  remaining_steps?: number;
  created_at?: string;
}

export interface IndividualMilestone {
  key: string;
  title: string;
  threshold_value: number;
  threshold_type: 'first_step' | 'steps_day' | 'streak_days' | 'miles_total' | 'steps_total';
  icon_name: string; // Lucide icon identifier
  scripture_ref: string;
  description: string;
  is_unlocked?: boolean;
  unlocked_at?: string | null;
}

export interface UserMilestoneUnlock {
  id: string;
  user_id: string;
  milestone_key: string;
  milestone_title: string;
  unlocked_at: string;
  value_at_unlock?: number;
  created_at?: string;
}

export interface CommunityEncouragement {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  message: string;
  prayer_tag?: string;
  reactions: Record<string, number>; // { prayer: 5, heart: 3, fire: 7, crown: 2, high_five: 4 }
  user_reactions?: string[]; // reactions activated by current user e.g. ['prayer', 'heart']
  likes_count?: number;
  created_at: string;
}

export interface EncouragementReaction {
  id: string;
  encouragement_id: string;
  user_id: string;
  reaction_type: 'prayer' | 'heart' | 'fire' | 'crown' | 'high_five';
  created_at: string;
}

export interface GroupStats {
  group_id: string;
  slug?: string;
  name?: string;
  group_number?: string;
  total_steps: number;
  total_miles: number;
  total_active_minutes?: number;
  active_members_count: number;
  total_members?: number;
  total_encouragements?: number;
  milestones_unlocked?: number;
  total_milestones?: number;
  current_milestone: GroupMilestone | null;
  next_milestone: GroupMilestone | null;
  progress_percentage: number;
}

export type GroupStatsSummary = GroupStats;

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  campus?: string;
  is_anonymous: boolean;
  total_steps: number;
  total_miles: number;
  active_days?: number;
  streak_days?: number;
  is_current_user?: boolean;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  total_days_logged: number;
  last_log_date: string | null;
}

export type StreakSummary = UserStreak;

// API DTOs & Payload Types
export interface StepLogPayload {
  steps: number;
  log_date?: string; // YYYY-MM-DD
  distance_miles?: number;
  active_minutes?: number;
  notes?: string;
  group_id?: string;
}

export interface EncouragementPostPayload {
  message: string;
  display_name?: string;
  prayer_tag?: string;
  group_id?: string;
}

export interface ReactionTogglePayload {
  encouragement_id: string;
  reaction_type: 'prayer' | 'heart' | 'fire' | 'crown' | 'high_five';
}

export interface ReflectionSavePayload {
  devotional_id: string;
  day_number?: number;
  reflection_text: string;
  is_shared_to_feed?: boolean;
  group_id?: string;
}

export interface JoinGroupPayload {
  group_slug?: string;
  group_number?: string;
  display_name?: string;
  campus?: string;
  is_anonymous?: boolean;
}

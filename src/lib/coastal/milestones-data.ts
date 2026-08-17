/**
 * Coastal Community Church (#3266) Faith & Fitness Walking and Step Tracker
 * Individual & Communal Milestone Definitions and Evaluation Engine
 *
 * Strictly zero emojis. Icon references are strings mapping to Lucide React SVG components.
 */

import { IndividualMilestone, GroupMilestone, StepLog } from "@/types/coastal";

export const INDIVIDUAL_MILESTONES: IndividualMilestone[] = [
  {
    key: "ind_first_step",
    title: "First Step of Faith",
    threshold_value: 1,
    threshold_type: "first_step",
    icon_name: "Footprints",
    scripture_ref: "Genesis 12:1",
    description: "Commenced your physical and spiritual transformation by logging your first steps.",
  },
  {
    key: "ind_5k_day",
    title: "Daily Faith Walk",
    threshold_value: 5000,
    threshold_type: "steps_day",
    icon_name: "Activity",
    scripture_ref: "Psalm 119:105",
    description: "Reached 5,000 steps in a single day, laying a solid foundation of daily aerobic movement.",
  },
  {
    key: "ind_10k_day",
    title: "Mountain Mover",
    threshold_value: 10000,
    threshold_type: "steps_day",
    icon_name: "Mountain",
    scripture_ref: "Matthew 17:20",
    description: "Achieved the gold standard of 10,000 steps in a single day with steadfast endurance.",
  },
  {
    key: "ind_15k_day",
    title: "Eagle's Wings",
    threshold_value: 15000,
    threshold_type: "steps_day",
    icon_name: "Sparkles",
    scripture_ref: "Isaiah 40:31",
    description: "Soared past 15,000 steps in a single day through disciplined stamina and determination.",
  },
  {
    key: "ind_streak_3",
    title: "Faith Stride Streak",
    threshold_value: 3,
    threshold_type: "streak_days",
    icon_name: "Flame",
    scripture_ref: "1 Thessalonians 5:17",
    description: "Built initial momentum with 3 consecutive active days of walking and devotion.",
  },
  {
    key: "ind_streak_7",
    title: "Covenant Streak",
    threshold_value: 7,
    threshold_type: "streak_days",
    icon_name: "Award",
    scripture_ref: "Galatians 6:9",
    description: "A full week (7 days) of unbroken daily movement honoring God with your temple.",
  },
  {
    key: "ind_streak_14",
    title: "14-Day Discipleship",
    threshold_value: 14,
    threshold_type: "streak_days",
    icon_name: "Crown",
    scripture_ref: "2 Timothy 4:7",
    description: "Completed the entire 14-Day Walking by Faith curriculum with unshakeable consistency.",
  },
  {
    key: "ind_miles_13",
    title: "Half-Marathon Trek",
    threshold_value: 13.1,
    threshold_type: "miles_total",
    icon_name: "Compass",
    scripture_ref: "1 Corinthians 9:26",
    description: "Accumulated 13.1 total miles of dedicated faith walking.",
  },
  {
    key: "ind_miles_26",
    title: "Marathon Pilgrimage",
    threshold_value: 26.2,
    threshold_type: "miles_total",
    icon_name: "Trophy",
    scripture_ref: "1 Corinthians 9:24",
    description: "Covered full marathon distance (26.2 miles) of cumulative walking fellowship.",
  },
  {
    key: "ind_miles_100",
    title: "Century Trail Walker",
    threshold_value: 100.0,
    threshold_type: "miles_total",
    icon_name: "Shield",
    scripture_ref: "Ephesians 6:13",
    description: "Surpassed 100 cumulative miles of consecrated physical conditioning.",
  },
  {
    key: "ind_steps_250k",
    title: "Quarter Million Club",
    threshold_value: 250000,
    threshold_type: "steps_total",
    icon_name: "Zap",
    scripture_ref: "Philippians 4:13",
    description: "Contributed 250,000 steps to your personal journey and the Coastal Community Church goal.",
  },
];

export const COMMUNAL_MILESTONES_SEED: Omit<GroupMilestone, "id" | "group_id">[] = [
  {
    title: "The Jericho March",
    target_steps: 50000,
    target_miles: 25.0,
    description: "United faith breaking through strongholds. 50,000 steps walked together in community.",
    scripture_theme: "Joshua 6:1-20 — By faith the walls of Jericho fell after the army marched around them.",
    icon_name: "Shield",
    is_reached: false,
  },
  {
    title: "Galilee Shoreline Trek",
    target_steps: 100000,
    target_miles: 50.0,
    description: "Answering the call to follow Christ in community. 100,000 steps of shared commitment.",
    scripture_theme: "Matthew 4:18-22 — Follow me, and I will make you fishers of men.",
    icon_name: "Compass",
    is_reached: false,
  },
  {
    title: "Mount Sinai Ascent",
    target_steps: 250000,
    target_miles: 125.0,
    description: "Collective elevation, endurance, and covenant stamina across our fellowship.",
    scripture_theme: "Exodus 19:1-20 — The Lord called Moses to the top of the mountain.",
    icon_name: "Mountain",
    is_reached: false,
  },
  {
    title: "The Road to Emmaus Journey",
    target_steps: 500000,
    target_miles: 250.0,
    description: "Deep fellowship, open eyes, and transformed hearts. Half a million steps walked in faith.",
    scripture_theme: "Luke 24:13-35 — Were not our hearts burning within us while he talked with us on the road?",
    icon_name: "Heart",
    is_reached: false,
  },
  {
    title: "The Roman Road Pilgrimage",
    target_steps: 1000000,
    target_miles: 500.0,
    description: "One Million Steps! Unstoppable gospel movement and collective triumph.",
    scripture_theme: "Romans 1:16, 10:9-15 — How beautiful are the feet of those who bring good news!",
    icon_name: "Crown",
    is_reached: false,
  },
  {
    title: "Promised Land Crossing",
    target_steps: 2500000,
    target_miles: 1250.0,
    description: "2.5 Million steps connecting hearts, building physical stamina, and claiming God's promises.",
    scripture_theme: "Joshua 1:9 — Be strong and courageous. The Lord your God is with you wherever you go.",
    icon_name: "Trophy",
    is_reached: false,
  },
];

/**
 * Evaluate user's individual milestone achievements against their step logs and streak.
 */
export function evaluateIndividualMilestones(
  logs: StepLog[],
  streakDays: number
): {
  unlocked: IndividualMilestone[];
  allWithStatus: IndividualMilestone[];
  nextMilestone: IndividualMilestone | null;
} {
  const totalSteps = logs.reduce((sum, log) => sum + (log.steps || 0), 0);
  const totalMiles = logs.reduce((sum, log) => sum + (log.distance_miles || 0), 0);
  const maxSingleDaySteps = logs.reduce((max, log) => Math.max(max, log.steps || 0), 0);
  const hasLogs = logs.length > 0 && totalSteps > 0;

  const allWithStatus = INDIVIDUAL_MILESTONES.map((milestone) => {
    let isUnlocked = false;

    switch (milestone.threshold_type) {
      case "first_step":
        isUnlocked = hasLogs;
        break;
      case "steps_day":
        isUnlocked = maxSingleDaySteps >= milestone.threshold_value;
        break;
      case "streak_days":
        isUnlocked = streakDays >= milestone.threshold_value;
        break;
      case "miles_total":
        isUnlocked = totalMiles >= milestone.threshold_value;
        break;
      case "steps_total":
        isUnlocked = totalSteps >= milestone.threshold_value;
        break;
      default:
        isUnlocked = false;
    }

    return {
      ...milestone,
      is_unlocked: isUnlocked,
    };
  });

  const unlocked = allWithStatus.filter((m) => m.is_unlocked);
  const nextMilestone = allWithStatus.find((m) => !m.is_unlocked) || null;

  return {
    unlocked,
    allWithStatus,
    nextMilestone,
  };
}

/**
 * Evaluate group communal milestones status based on total group steps.
 */
export function evaluateCommunalMilestones(
  totalSteps: number,
  groupId: string = "coastal-3266"
): {
  milestones: GroupMilestone[];
  currentMilestone: GroupMilestone | null;
  nextMilestone: GroupMilestone | null;
  progressPercentage: number;
} {
  const milestones: GroupMilestone[] = COMMUNAL_MILESTONES_SEED.map((seed, index) => {
    const isReached = totalSteps >= seed.target_steps;
    return {
      id: `milestone-${index + 1}`,
      group_id: groupId,
      title: seed.title,
      target_steps: seed.target_steps,
      target_miles: seed.target_miles,
      description: seed.description,
      scripture_theme: seed.scripture_theme,
      icon_name: seed.icon_name,
      is_reached: isReached,
      unlocked_at: isReached ? new Date().toISOString() : null,
      remaining_steps: Math.max(0, seed.target_steps - totalSteps),
    };
  });

  const reachedMilestones = milestones.filter((m) => m.is_reached);
  const currentMilestone = reachedMilestones.length > 0
    ? reachedMilestones[reachedMilestones.length - 1]
    : null;

  const nextMilestone = milestones.find((m) => !m.is_reached) || null;

  const targetGoal = nextMilestone ? nextMilestone.target_steps : 2500000;
  const progressPercentage = Math.min(100, Math.round((totalSteps / targetGoal) * 10000) / 100);

  return {
    milestones,
    currentMilestone,
    nextMilestone,
    progressPercentage,
  };
}

export interface DuolingoUser {
  id: string;
  username: string;
  displayName: string | null;
  pictureUrl: string | null;
  fromLanguage: string | null;
  learningLanguage: string | null;
  totalXp: number | null;
  gems: number | null;
  streak: number | null;
}

export interface DuolingoLeaderboardEntry {
  userId: string;
  username: string | null;
  displayName: string | null;
  score: number;
  rank: number | null;
  pictureUrl: string | null;
}

export interface DuolingoLeaderboard {
  entries: DuolingoLeaderboardEntry[];
  currentUser: DuolingoLeaderboardEntry | null;
}

export interface DuolingoGoalDefinition {
  goalId: string;
  badgeId: string | null;
  category: string | null;
  metric: string | null;
  threshold: number | null;
  title: string | null;
}

export interface DuolingoGoalSchema {
  goals: DuolingoGoalDefinition[];
  badges: unknown[];
}

export interface DuolingoGoalProgress {
  progress: Record<string, number>;
  earnedBadges: string[];
}

export interface DuolingoShopItem {
  id: string;
  name: string | null;
  type: string | null;
  currencyType: string | null;
  raw: unknown;
}

export interface DuolingoCourse {
  firstSkillId: string | null;
  raw: unknown;
}

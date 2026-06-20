export type ProgressTrack = "interpreter" | "uploader";

export type LevelDefinition = {
  level: number;
  xp: number;
  title: string;
};

export type UserStats = {
  interpreterXp: number;
  uploaderXp: number;
  activityStreak: number;
  lastContributionDate: string | null;
  dailyValidActivityCount: number;
  dailyActivityDate: string | null;
  dailyBonusDate: string | null;
  currentCombo: number;
  maxCombo: number;
  comboDate: string | null;
};

export const interpreterLevels: LevelDefinition[] = [
  { level: 1, xp: 0, title: "견습 판독원" },
  { level: 2, xp: 50, title: "예리한 판독러" },
  { level: 3, xp: 150, title: "난독 탐정" },
  { level: 4, xp: 350, title: "악필 감정사" },
  { level: 5, xp: 700, title: "인간 OCR" },
  { level: 6, xp: 1200, title: "미제 해결사" },
  { level: 7, xp: 2000, title: "전설의 해독왕" },
];

export const uploaderLevels: LevelDefinition[] = [
  { level: 1, xp: 0, title: "신입 삐뚜루" },
  { level: 2, xp: 30, title: "지렁이 작가" },
  { level: 3, xp: 100, title: "난독 제조기" },
  { level: 4, xp: 250, title: "정답률 파괴자" },
  { level: 5, xp: 500, title: "인간 캡차" },
  { level: 6, xp: 900, title: "미제 사건 설계자" },
  { level: 7, xp: 1500, title: "악필계 최종 보스" },
];

export const defaultUserStats: UserStats = {
  interpreterXp: 0,
  uploaderXp: 0,
  activityStreak: 0,
  lastContributionDate: null,
  dailyValidActivityCount: 0,
  dailyActivityDate: null,
  dailyBonusDate: null,
  currentCombo: 0,
  maxCombo: 0,
  comboDate: null,
};

export function getKstDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00+09:00`);
  value.setDate(value.getDate() + amount);
  return getKstDate(value);
}

export function levelsFor(track: ProgressTrack) {
  return track === "interpreter" ? interpreterLevels : uploaderLevels;
}

export function getLevel(track: ProgressTrack, xp: number) {
  const levels = levelsFor(track);
  let current = levels[0];
  for (const level of levels) {
    if (xp < level.xp) break;
    current = level;
  }
  const next = levels.find((level) => level.level === current.level + 1) ?? null;
  const progress = next
    ? Math.min(100, Math.max(0, ((xp - current.xp) / (next.xp - current.xp)) * 100))
    : 100;
  return { current, next, progress };
}

export function applyContribution(
  stats: UserStats,
  options: { track: ProgressTrack; xp: number; correct?: boolean; valid: boolean },
  today = getKstDate(),
) {
  if (!options.valid) {
    if (options.track !== "interpreter" || options.correct === undefined) {
      return stats;
    }
    const currentCombo = options.correct ? stats.currentCombo + 1 : 0;
    return {
      ...stats,
      currentCombo,
      maxCombo: Math.max(stats.maxCombo, currentCombo),
      comboDate: today,
    };
  }

  const firstActivityToday = stats.lastContributionDate !== today;
  const yesterday = addDays(today, -1);
  const activityStreak = firstActivityToday
    ? stats.lastContributionDate === yesterday
      ? stats.activityStreak + 1
      : 1
    : stats.activityStreak;
  const dailyValidActivityCount =
    stats.dailyActivityDate === today ? stats.dailyValidActivityCount + 1 : 1;
  const dailyBonusEarned =
    dailyValidActivityCount >= 3 && stats.dailyBonusDate !== today;
  const streakBonusEarned = firstActivityToday && activityStreak === 3;
  const earnedXp =
    options.xp + (dailyBonusEarned ? 10 : 0) + (streakBonusEarned ? 10 : 0);

  let currentCombo = stats.currentCombo;
  if (options.track === "interpreter") {
    currentCombo = options.correct ? currentCombo + 1 : 0;
  }

  return {
    ...stats,
    interpreterXp:
      stats.interpreterXp + (options.track === "interpreter" ? earnedXp : 0),
    uploaderXp: stats.uploaderXp + (options.track === "uploader" ? earnedXp : 0),
    activityStreak,
    lastContributionDate: today,
    dailyValidActivityCount,
    dailyActivityDate: today,
    dailyBonusDate: dailyBonusEarned ? today : stats.dailyBonusDate,
    currentCombo,
    maxCombo: Math.max(stats.maxCombo, currentCombo),
    comboDate: options.track === "interpreter" ? today : stats.comboDate,
  };
}

export function comboMessage(combo: number) {
  if (combo >= 15) return "악필과 눈 맞은 자";
  if (combo >= 10) return "인간 OCR 모드";
  if (combo >= 5) return "오늘 감 좋음";
  if (combo >= 3) return "눈썰미 예열 완료";
  return null;
}

export function comboMilestoneMessage(combo: number) {
  if (combo === 15) return "악필과 눈 맞은 자";
  if (combo === 10) return "인간 OCR 모드";
  if (combo === 5) return "오늘 감 좋음";
  if (combo === 3) return "눈썰미 예열 완료";
  return null;
}

export function isPermanentUser(isAnonymous?: boolean) {
  return isAnonymous === false;
}

import type { ReactionCounts } from "@/lib/reactions";

export type Difficulty = "쉬움" | "보통" | "어려움" | "악필의 끝";
export type ChallengeTag = "hot" | "new" | "hard" | "easy";

export const RATE_AGGREGATION_MIN_TRIES = 5;
export const POPULAR_MIN_TRIES = 10;
export const HARD_MAX_SUCCESS_RATE = 30;
export const EASY_MIN_SUCCESS_RATE = 60;
export const NEW_WINDOW_MS = 72 * 60 * 60 * 1000;

export type Challenge = {
  id: number;
  handwriting: string;
  imageData?: string;
  answer: string;
  author: string;
  authorId?: string;
  difficulty: Difficulty;
  successRate: number;
  tries: number;
  hint: string;
  tags: ChallengeTag[];
  reactionCounts: ReactionCounts;
  createdAt?: string;
};

export const difficultyClass: Record<Difficulty, string> = {
  쉬움: "difficulty-easy",
  보통: "difficulty-normal",
  어려움: "difficulty-hard",
  "악필의 끝": "difficulty-extreme",
};

export function deriveChallengeTags(
  challenge: Pick<Challenge, "tries" | "successRate" | "createdAt">,
  now = Date.now(),
): ChallengeTag[] {
  const tags: ChallengeTag[] = [];

  if (challenge.tries >= POPULAR_MIN_TRIES) tags.push("hot");

  if (challenge.createdAt) {
    const age = now - new Date(challenge.createdAt).getTime();
    if (age >= 0 && age <= NEW_WINDOW_MS) tags.push("new");
  }

  if (challenge.tries >= RATE_AGGREGATION_MIN_TRIES) {
    if (challenge.successRate <= HARD_MAX_SUCCESS_RATE) tags.push("hard");
    if (challenge.successRate >= EASY_MIN_SUCCESS_RATE) tags.push("easy");
  }

  return tags;
}

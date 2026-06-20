import type { ReactionCounts } from "@/lib/reactions";

export type Difficulty = "쉬움" | "보통" | "어려움" | "악필의 끝";
export type ChallengeTag = "hot" | "new" | "hard" | "easy";

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

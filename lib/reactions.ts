import type { ChallengeTag } from "@/lib/challenges";

export const reactionOptions = [
  { key: "laugh", icon: "😂" },
  { key: "mindblown", icon: "🤯" },
  { key: "clap", icon: "👏" },
  { key: "think", icon: "🤔" },
] as const;

export type ReactionKey = (typeof reactionOptions)[number]["key"];
export type ReactionCounts = Record<ReactionKey, number>;

const REACTION_PREFIX = "reaction:";
const challengeTags = new Set<ChallengeTag>(["hot", "new", "hard", "easy"]);

export function emptyReactionCounts(): ReactionCounts {
  return { laugh: 0, mindblown: 0, clap: 0, think: 0 };
}

export function parseReactionCounts(tags: unknown): ReactionCounts {
  const counts = emptyReactionCounts();
  if (!Array.isArray(tags)) return counts;

  for (const tag of tags) {
    if (typeof tag !== "string" || !tag.startsWith(REACTION_PREFIX)) continue;
    const [, key, rawCount] = tag.split(":");
    if (!(key in counts)) continue;
    counts[key as ReactionKey] = Math.max(0, Number.parseInt(rawCount, 10) || 0);
  }
  return counts;
}

export function parseChallengeTags(tags: unknown): ChallengeTag[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter(
    (tag): tag is ChallengeTag =>
      typeof tag === "string" && challengeTags.has(tag as ChallengeTag),
  );
}

export function updateReactionTag(
  tags: unknown,
  key: ReactionKey,
  count: number,
) {
  const current = Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const prefix = `${REACTION_PREFIX}${key}:`;
  return [...current.filter((tag) => !tag.startsWith(prefix)), `${prefix}${count}`];
}

export function isReactionKey(value: unknown): value is ReactionKey {
  return reactionOptions.some((option) => option.key === value);
}

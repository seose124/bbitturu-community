"use client";

import { useMemo, useState } from "react";
import { useBbiduru } from "@/components/app-provider";
import {
  ChallengeListItem,
  EmptyChallenge,
} from "@/components/challenge-ui";
import { BottomNav, Page, TopBar } from "@/components/layout";
import type { ChallengeTag } from "@/lib/challenges";

type Filter = "all" | ChallengeTag;

const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "전체" },
  { value: "hot", label: "🔥 인기" },
  { value: "new", label: "NEW" },
  { value: "hard", label: "💀 어려운" },
  { value: "easy", label: "😊 쉬운" },
];

export default function ChallengesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const { challenges } = useBbiduru();
  const visibleChallenges = useMemo(
    () =>
      filter === "all"
        ? challenges
        : challenges.filter((challenge) => challenge.tags.includes(filter)),
    [challenges, filter],
  );

  return (
    <Page>
      <div className="page-column">
        <TopBar title="판독 챌린지" backHref="/" />
        <div className="filter-row" role="tablist" aria-label="챌린지 필터">
          {filters.map((item) => (
            <button
              className={`filter-chip ${filter === item.value ? "active" : ""}`}
              key={item.value}
              onClick={() => setFilter(item.value)}
              role="tab"
              aria-selected={filter === item.value}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="scroll-content challenge-list">
          {visibleChallenges.length ? (
            visibleChallenges.map((challenge) => (
              <ChallengeListItem challenge={challenge} key={challenge.id} />
            ))
          ) : (
            <EmptyChallenge />
          )}
        </div>
        <BottomNav />
      </div>
    </Page>
  );
}

"use client";

import Link from "next/link";
import { Flame, Menu } from "lucide-react";
import { useState } from "react";
import { useBbiduru } from "@/components/app-provider";
import {
  DailyCaseEmpty,
  DailyChallengeCard,
  DailyCasesCarousel,
  HomeChallengeCard,
} from "@/components/challenge-ui";
import { HomeDrawer } from "@/components/home-drawer";
import { Page, TopBar } from "@/components/layout";

export default function HomePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { challenges, dailyChallenges, dailyProgress, stats, unreadCount } =
    useBbiduru();
  const hot = challenges
    .filter((challenge) => challenge.tags.includes("hot"))
    .slice(0, 3);
  const fresh = challenges
    .filter((challenge) => challenge.tags.includes("new"))
    .slice(0, 2);

  return (
    <Page dark>
      <div className="page-column">
        <TopBar
          logo={
            <div className="home-logo">
              <img src="/logo-symbol.png" className="home-logo-symbol" alt="" />
              삐뚜루
            </div>
          }
          dark
          right={
            <div className="topbar-buttons">
              <Link className="icon-button notification-button" href="/notifications" aria-label="알림">
                <img src="/icons/icon-bell.svg" width={19} height={19} alt="" />
                {unreadCount ? <span className="notification-dot">{unreadCount}</span> : null}
              </Link>
              <button
                className="icon-button"
                onClick={() => setDrawerOpen(true)}
                aria-label="메뉴 열기"
              >
                <Menu size={20} strokeWidth={2.2} />
              </button>
            </div>
          }
        />
        <div className="scroll-content home-content">
          <section className="daily-case-section">
            <div className="section-heading">
              <h2>오늘의 미제 악필</h2>
              <span className="daily-contribution">
                오늘 {dailyProgress}/3 기여 · 연속 {stats.activityStreak}일
              </span>
            </div>
            <p className="daily-xp-notice"><Flame size={12} /> 참여하면 판독단 +3 XP</p>
            {dailyChallenges.length > 0 ? (
              <DailyCasesCarousel challenges={dailyChallenges} />
            ) : (
              <DailyCaseEmpty />
            )}
          </section>

          {hot.length > 0 && (
            <section>
              <div className="section-heading">
                <h2><img src="/icons/icon-hot.svg" className="section-icon" alt="" /> 인기 챌린지</h2>
                <Link href="/challenges">전체보기 →</Link>
              </div>
              <div className="challenge-stack">
                {hot.map((challenge) => (
                  <HomeChallengeCard
                    challenge={challenge}
                    key={challenge.id}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="section-heading section-heading-spaced">
              <h2><img src="/icons/icon-new.svg" className="section-icon" alt="" /> 새로 올라왔어요</h2>
            </div>
            <div className="challenge-stack">
              {fresh.map((challenge) => (
                <HomeChallengeCard
                  challenge={challenge}
                  key={challenge.id}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
      <HomeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Page>
  );
}

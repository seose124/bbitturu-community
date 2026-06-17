"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { useState } from "react";
import { useBbiduru } from "@/components/app-provider";
import { HomeChallengeCard } from "@/components/challenge-ui";
import { HomeDrawer } from "@/components/home-drawer";
import { BottomNav, Page, TopBar } from "@/components/layout";

export default function HomePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { challenges, showToast } = useBbiduru();
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
              <button
                className="icon-button"
                onClick={() => showToast("알림 기능을 준비하고 있어요")}
                aria-label="알림"
              >
                <Bell size={19} strokeWidth={2} />
              </button>
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
          <section>
            <div className="section-heading">
              <h2>🔥 인기 챌린지</h2>
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

          <section>
            <div className="section-heading section-heading-spaced">
              <h2>✨ 새로 올라왔어요</h2>
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
        <BottomNav />
      </div>
      <HomeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Page>
  );
}

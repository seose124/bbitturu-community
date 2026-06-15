"use client";

import {
  ChevronRight,
  Flame,
  Link as LinkIcon,
  LogIn,
  LogOut,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useBbiduru } from "@/components/app-provider";
import { BottomNav, Page, TopBar } from "@/components/layout";

export default function ProfilePage() {
  const { user, challenges, attempts, signOut, showToast } = useBbiduru();
  const uploaded = challenges.filter((c) => c.authorId && user && c.authorId === user.id).length;
  const attemptCount = Object.keys(attempts).length;

  return (
    <Page>
      <div className="page-column">
        <TopBar logo="마이페이지" />
        <div className="scroll-content profile-content">
          {user ? (
            <>
              <section className="profile-header">
                <div className="avatar">삐</div>
                <div>
                  <h1>{user.email?.split("@")[0] ?? "판독마스터"}</h1>
                  <p className="profile-email">{user.email}</p>
                  <div className="badge-row">
                    <span className="badge badge-green">
                      <Search size={11} /> 판독단
                    </span>
                    <span className="badge badge-level">삐뚤이</span>
                  </div>
                </div>
              </section>

              <section className="card outlined stats-card">
                <p className="eyebrow">내 기록</p>
                <div className="stats-grid">
                  <div>
                    <strong>{uploaded}</strong>
                    <span>업로드 챌린지</span>
                  </div>
                  <div>
                    <strong>{attemptCount}</strong>
                    <span>판독 시도</span>
                  </div>
                  <div>
                    <strong>—</strong>
                    <span>판독 성공률</span>
                  </div>
                  <div className="dark-stat">
                    <strong>
                      — <Flame size={18} fill="currentColor" />
                    </strong>
                    <span>연속 판독일</span>
                  </div>
                </div>
              </section>

              <section className="card outlined profile-menu">
                <button onClick={() => showToast("친구 초대 링크를 복사했어요")}>
                  <LinkIcon size={18} />
                  <span>친구 초대하기</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={async () => {
                    await signOut();
                    showToast("로그아웃됐어요");
                  }}
                >
                  <LogOut size={18} />
                  <span>로그아웃</span>
                  <ChevronRight size={16} />
                </button>
              </section>
            </>
          ) : (
            <>
              <section className="profile-header">
                <div className="avatar">?</div>
                <div>
                  <h1>로그인이 필요해요</h1>
                  <p className="page-subtitle" style={{ margin: 0 }}>
                    로그인하면 챌린지를 올리고<br />내 기록을 관리할 수 있어요
                  </p>
                </div>
              </section>

              <Link href="/login" className="button button-primary">
                <LogIn size={18} />
                이메일로 로그인하기
              </Link>

              <section className="card outlined stats-card">
                <p className="eyebrow">비로그인 기록</p>
                <div className="stats-grid">
                  <div>
                    <strong>{attemptCount}</strong>
                    <span>판독 시도</span>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
        <BottomNav />
      </div>
    </Page>
  );
}

"use client";

import {
  ChevronRight,
  Flame,
  Link as LinkIcon,
  Search,
} from "lucide-react";
import { useBbiduru } from "@/components/app-provider";
import { BottomNav, Page, TopBar } from "@/components/layout";

export default function ProfilePage() {
  const { challenges, attempts, showToast } = useBbiduru();
  const uploaded = challenges.filter((challenge) => challenge.author === "나")
    .length;
  const attemptCount = Object.keys(attempts).length;

  return (
    <Page>
      <div className="page-column">
        <TopBar logo="마이페이지" />
        <div className="scroll-content profile-content">
          <section className="profile-header">
            <div className="avatar">삐</div>
            <div>
              <h1>판독마스터</h1>
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
                <strong>{12 + uploaded}</strong>
                <span>업로드 챌린지</span>
              </div>
              <div>
                <strong>{48 + attemptCount}</strong>
                <span>판독 시도</span>
              </div>
              <div>
                <strong>34%</strong>
                <span>판독 성공률</span>
              </div>
              <div className="dark-stat">
                <strong>
                  3 <Flame size={18} fill="currentColor" />
                </strong>
                <span>연속 판독일</span>
              </div>
            </div>
          </section>

          <section className="card outlined level-card">
            <div className="level-heading">
              <strong>판독 레벨</strong>
              <span className="badge badge-level">삐뚤이</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "35%" }} />
            </div>
            <p>
              다음 레벨까지 <strong>65번</strong> 더 판독하세요
            </p>
          </section>

          <section className="card outlined profile-menu">
            <button onClick={() => showToast("친구 초대 링크를 복사했어요")}>
              <LinkIcon size={18} />
              <span>친구 초대하기</span>
              <ChevronRight size={16} />
            </button>
          </section>
        </div>
        <BottomNav />
      </div>
    </Page>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronRight,
  Flame,
  Link as LinkIcon,
} from "lucide-react";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";
import { getLevel, type ProgressTrack } from "@/lib/progression";
import { answerSimilarity } from "@/lib/similarity";

const NICKNAME_KEY = "bbiduru-nickname";
const REPRESENTATIVE_KEY = "bbiduru-representative-track";

function LevelCard({
  track,
  xp,
  representative,
  onSelect,
}: {
  track: ProgressTrack;
  xp: number;
  representative: boolean;
  onSelect: () => void;
}) {
  const { current, next, progress } = getLevel(track, xp);
  const label = track === "interpreter" ? "판독단" : "악필러";
  return (
    <button
      className={`card outlined profile-level-card${representative ? " representative" : ""}`}
      type="button"
      onClick={onSelect}
      aria-label={`${label} ${current.level}레벨 ${current.title}, 대표 칭호로 설정`}
    >
      <div className="profile-level-heading">
        <span>{label}</span>
        {representative ? <span className="badge badge-level">대표 칭호</span> : null}
      </div>
      <div className="profile-level-title">
        <strong>Lv.{current.level} {current.title}</strong>
        <span>{xp} XP</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={`${xp} XP, 다음 레벨 ${next?.xp ?? xp} XP`}
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p>{next ? `다음 레벨까지 ${next.xp - xp} XP` : "최고 레벨에 도달했어요"}</p>
    </button>
  );
}

export default function ProfilePage() {
  const {
    user,
    challenges,
    attempts,
    stats,
    unreadCount,
    unreadReportCount,
    showToast,
  } = useBbiduru();
  const [savedNickname, setSavedNickname] = useState<string | null>(null);
  const [representative, setRepresentative] =
    useState<ProgressTrack>("interpreter");
  const uploaded = challenges.filter(
    (challenge) => challenge.authorId && user && challenge.authorId === user.id,
  ).length;
  const attemptValues = Object.entries(attempts).filter(([, attempt]) => !attempt.passed);
  const attemptCount = attemptValues.length;
  const successRate = attemptCount
    ? Math.round(
        (attemptValues.filter(([id, attempt]) => {
          if (attempt.correct) return true;
          const challenge = challenges.find((item) => item.id === Number(id));
          return Boolean(
            challenge && answerSimilarity(challenge.answer, attempt.answer) > 0.55,
          );
        }).length /
          attemptCount) *
          100,
      )
    : null;
  const shortId = user?.id?.slice(0, 6) ?? "------";
  const representativeXp =
    representative === "interpreter" ? stats.interpreterXp : stats.uploaderXp;
  const representativeLevel = getLevel(representative, representativeXp).current;

  useEffect(() => {
    const saved = window.localStorage.getItem(NICKNAME_KEY);
    const savedRepresentative = window.localStorage.getItem(REPRESENTATIVE_KEY);
    queueMicrotask(() => {
      if (saved) setSavedNickname(saved);
      if (savedRepresentative === "interpreter" || savedRepresentative === "uploader") {
        setRepresentative(savedRepresentative);
      }
    });
  }, []);

  const selectRepresentative = (track: ProgressTrack) => {
    setRepresentative(track);
    window.localStorage.setItem(REPRESENTATIVE_KEY, track);
    showToast("대표 칭호를 바꿨어요");
  };

  return (
    <Page>
      <div className="page-column">
        <TopBar logo="마이페이지" />
        <div className="scroll-content profile-content">
          <section className="profile-header">
            <div className="avatar">
              <img src="/icons/icon-face.svg" width={36} height={36} alt="" />
            </div>
            <div>
              <h1>{savedNickname ?? `판독가 #${shortId}`}</h1>
              <div className="badge-row">
                <span className="badge badge-green">
                  <img src="/icons/icon-pencil.svg" width={11} height={11} alt="" />
                  Lv.{representativeLevel.level} {representativeLevel.title}
                </span>
              </div>
            </div>
          </section>

          <section className="profile-levels" aria-label="내 레벨">
            <LevelCard
              track="interpreter"
              xp={stats.interpreterXp}
              representative={representative === "interpreter"}
              onSelect={() => selectRepresentative("interpreter")}
            />
            <LevelCard
              track="uploader"
              xp={stats.uploaderXp}
              representative={representative === "uploader"}
              onSelect={() => selectRepresentative("uploader")}
            />
          </section>

          <section className="card outlined stats-card">
            <p className="eyebrow">내 기록</p>
            <div className="stats-grid">
              <Link className="stats-link" href="/profile/uploads">
                <strong>{uploaded}</strong>
                <span>업로드한 챌린지</span>
                {unreadReportCount ? (
                  <em className="stats-new">새 결과 {unreadReportCount}</em>
                ) : null}
              </Link>
              <div>
                <strong>{attemptCount}</strong>
                <span>판독 시도</span>
              </div>
              <div>
                <strong>{successRate === null ? "—" : `${successRate}%`}</strong>
                <span>판독 성공률</span>
              </div>
              <div className="dark-stat">
                <strong>
                  {stats.activityStreak || "—"} <Flame size={18} fill="currentColor" />
                </strong>
                <span>연속 활동일</span>
              </div>
            </div>
          </section>

          <section className="card outlined profile-menu">
            <Link href="/profile/uploads">
              <img src="/icons/icon-folder.svg" width={18} height={18} alt="" />
              <span>업로드한 챌린지</span>
              {unreadReportCount ? <b>{unreadReportCount}</b> : null}
              <ChevronRight size={16} />
            </Link>
            <div className="divider" />
            <Link href="/notifications">
              <Bell size={18} />
              <span>알림</span>
              {unreadCount ? <b>{unreadCount}</b> : null}
              <ChevronRight size={16} />
            </Link>
            <div className="divider" />
            <button onClick={() => showToast("친구 초대 링크를 복사했어요")}>
              <LinkIcon size={18} />
              <span>친구 초대하기</span>
              <ChevronRight size={16} />
            </button>
          </section>
        </div>
      </div>
    </Page>
  );
}

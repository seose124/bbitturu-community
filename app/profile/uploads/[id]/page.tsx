"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Share2, Users } from "lucide-react";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";
import { getLevel } from "@/lib/progression";

export default function UploadReportPage() {
  const params = useParams<{ id: string }>();
  const challengeId = Number(params.id);
  const {
    user,
    stats,
    getChallenge,
    getChallengeReport,
    markReportSeen,
    showToast,
  } = useBbiduru();
  const challenge = getChallenge(challengeId);
  const report = getChallengeReport(challengeId);
  const uploaderLevel = getLevel("uploader", stats.uploaderXp);
  const isOwner = Boolean(user && challenge?.authorId === user.id);

  useEffect(() => {
    if (isOwner) void markReportSeen(challengeId);
  }, [challengeId, isOwner, markReportSeen]);

  if (!challenge || !isOwner) {
    return (
      <Page>
        <div className="page-column">
          <TopBar title="판독 리포트" backHref="/profile/uploads" />
          <div className="empty-state fill">
            <strong>확인할 수 없는 리포트예요</strong>
            <span>내가 올린 챌린지만 전체 결과를 볼 수 있어요.</span>
          </div>
        </div>
      </Page>
    );
  }

  const collecting = report.tries < 5;
  const share = async () => {
    const url = `${window.location.origin}/challenges/${challenge.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "삐뚜루 악필력 테스트",
          text: collecting
            ? `현재 ${report.tries}명이 내 글씨에 도전 중이에요.`
            : `내 글씨 판독 성공률은 ${report.successRate}%예요.`,
          url,
        });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    showToast("도전 링크를 복사했어요");
  };

  return (
    <Page>
      <div className="page-column">
        <TopBar title="판독 리포트" backHref="/profile/uploads" />
        <div className="scroll-content report-content">
          <section className="card outlined report-hero">
            <div className="report-image">
              {challenge.imageData ? (
                <img src={challenge.imageData} alt="내 악필 이미지" />
              ) : (
                <span className="handwriting">{challenge.handwriting}</span>
              )}
            </div>
            <div className="report-answer">
              <span className="badge badge-dark">실제 정답</span>
              <strong>&ldquo;{challenge.answer}&rdquo;</strong>
            </div>
          </section>

          <section className="card outlined report-summary">
            <div className="report-title-row">
              <div>
                <span>{collecting ? "현재까지" : "내 악필력 테스트"}</span>
                <h1>{report.difficultyTitle}</h1>
              </div>
              <span className="report-rate">
                {collecting ? `${report.tries}/5` : `${report.successRate}%`}
              </span>
            </div>
            <div className="report-stat-grid">
              <div>
                <strong>{report.tries}</strong>
                <span>도전한 사람</span>
              </div>
              <div>
                <strong>{report.correctCount}</strong>
                <span>정답자</span>
              </div>
              <div>
                <strong>{report.successRate}%</strong>
                <span>{collecting ? "현재 성공률" : "판독 성공률"}</span>
              </div>
            </div>
            {collecting ? (
              <div className="report-collecting">
                <Users size={16} />
                <span>{5 - report.tries}명만 더 도전하면 리포트가 완성돼요.</span>
              </div>
            ) : null}
          </section>

          <section className="card outlined report-wrong-answers">
            <h2>많이 나온 오답</h2>
            {report.topWrongAnswers.length ? (
              <ol>
                {report.topWrongAnswers.map((item) => (
                  <li key={item.answer}>
                    <span>&ldquo;{item.answer}&rdquo;</span>
                    <strong>{item.count}명</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p>{report.tries ? "아직 의견이 갈리고 있어요." : "첫 판독이 도착하면 오답도 모아드릴게요."}</p>
            )}
          </section>

          <section className="card outlined report-growth">
            <div>
              <span>악필러 성장</span>
              <strong>Lv.{uploaderLevel.current.level} {uploaderLevel.current.title}</strong>
            </div>
            <span>{stats.uploaderXp} XP</span>
          </section>

          <button className="button button-green" type="button" onClick={() => void share()}>
            <Share2 size={17} /> 내 악필력 공유하기
          </button>
          <Link className="button button-ghost" href={`/challenges/${challenge.id}`}>
            더 많은 판독 받기
          </Link>
        </div>
      </div>
    </Page>
  );
}

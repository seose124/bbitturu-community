"use client";

import {
  Camera,
  Copy,
  Link as LinkIcon,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useBbiduru } from "@/components/app-provider";
import { trackResultShared } from "@/lib/analytics";
import { Page, TopBar } from "@/components/layout";
import { charMatchRate } from "@/lib/similarity";

export default function SharePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { challenges, attempts, getChallenge, showToast } = useBbiduru();
  const challenge = getChallenge(Number(params.id));
  const attempt = challenge ? attempts[challenge.id] : undefined;
  const [progressVisible, setProgressVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setProgressVisible(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  const isCorrect = Boolean(attempt && !attempt.passed && attempt.correct);

  const myRate = useMemo(() => {
    if (!challenge || !attempt || attempt.passed) return 0;
    return Math.round(charMatchRate(challenge.answer, attempt.answer) * 100);
  }, [challenge, attempt]);

  if (!challenge) {
    return (
      <Page dark>
        <div className="page-column">
          <TopBar title="결과 공유" backHref="/challenges" dark />
          <div className="empty-state fill dark-empty">
            <strong>챌린지를 찾을 수 없어요</strong>
          </div>
        </div>
      </Page>
    );
  }

  const currentIndex = challenges.findIndex((item) => item.id === challenge.id);
  const nextChallenge = challenges[(currentIndex + 1) % challenges.length];
  const avgRate = Math.min(100, Math.max(0, Math.round(challenge.successRate)));
  const hasCommunityAverage = challenge.tries >= 5;
  const displayedAvgRate = hasCommunityAverage ? avgRate : 0;
  const shareUrl = `${window.location.origin}/challenges/${challenge.id}/share`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      trackResultShared(challenge.id, "link_copy", isCorrect);
      showToast("링크를 복사했어요");
    } catch {
      showToast("링크 복사에 실패했어요");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "삐뚜루 판독 챌린지",
          text: `${displayedAvgRate}%만 판독한 악필에 도전해보세요.`,
          url: shareUrl,
        });
        trackResultShared(challenge.id, "native_share", isCorrect);
        return;
      } catch {
        return;
      }
    }
    await copyLink();
  };

  return (
    <Page dark>
      <div className="page-column">
        <TopBar
          title="결과 공유"
          backHref={`/challenges/${challenge.id}/result`}
          dark
          right={
            <button className="share-top-button" onClick={share}>
              <Share2 size={14} /> 공유
            </button>
          }
        />
        <div className="scroll-content share-content">
          <p className="share-intro">이 결과를 자랑해보세요 🔥</p>

          {/* 악필 사진 */}
          {challenge.imageData ? (
            <div className="card outlined result-preview">
              <img
                src={challenge.imageData}
                alt="악필 이미지"
                className="result-preview-img"
              />
            </div>
          ) : (
            <div className="share-writing">
              <span className="handwriting">
                {challenge.handwriting.replace(/\n/g, " ")}
              </span>
            </div>
          )}

          {/* 나의 판독 + 판독 성공률 + 평균 */}
          <article className="card outlined result-card">
            {attempt && !attempt.passed ? (
              <div className="answer-reveal">
                <span className="badge badge-dark">나의 판독</span>
                <h2>&ldquo;{attempt.answer}&rdquo;</h2>
              </div>
            ) : null}
            <div className="result-details">
              {attempt && !attempt.passed ? (
                <>
                  <div className="result-rate-line">
                    <span>나의 판독 성공률</span>
                    <strong>{myRate}%</strong>
                  </div>
                  <div className="result-progress-wrap">
                    <div className="progress-track">
                      <div
                        className="progress-fill success-fill"
                        style={{ width: progressVisible ? `${myRate}%` : "0%" }}
                      />
                    </div>
                    {hasCommunityAverage ? (
                      <div
                        className="avg-marker"
                        style={{ left: `${displayedAvgRate}%` }}
                      />
                    ) : null}
                  </div>
                  <div className="avg-label-wrap">
                    <span
                      className={`avg-label ${hasCommunityAverage ? "" : "avg-label-pending"}`}
                      style={{ left: hasCommunityAverage ? `${displayedAvgRate}%` : 0 }}
                    >
                      <span>평균 {displayedAvgRate}%</span>
                      {!hasCommunityAverage ? (
                        <small>평균값은 참여자 5명이 모여야 집계돼요</small>
                      ) : null}
                    </span>
                  </div>
                </>
              ) : (
                <div className="result-rate-line">
                  <span>평균 성공률</span>
                  <strong>{displayedAvgRate}%</strong>
                </div>
              )}
            </div>
          </article>

          <div className="share-options">
            <button
              className="share-option kakao"
              onClick={() => {
                trackResultShared(challenge.id, "kakao", isCorrect);
                showToast("카카오톡 공유를 준비하고 있어요");
              }}
            >
              <MessageCircle size={23} fill="currentColor" />
              <span>카카오톡</span>
            </button>
            <button
              className="share-option instagram"
              onClick={() => {
                trackResultShared(challenge.id, "instagram", isCorrect);
                showToast("인스타그램 공유를 준비하고 있어요");
              }}
            >
              <Camera size={23} />
              <span>인스타</span>
            </button>
            <button className="share-option dark-option" onClick={copyLink}>
              <LinkIcon size={23} />
              <span>링크</span>
            </button>
            <button className="share-option dark-option" onClick={share}>
              <MoreHorizontal size={23} />
              <span>더보기</span>
            </button>
          </div>

          <button
            className="button button-accent share-try-button"
            onClick={() => router.push(`/challenges/${challenge.id}`)}
          >
            나도 풀어보기
          </button>

          {attempt ? (
            <button
              className="button button-ghost"
              onClick={() => router.push(`/challenges/${nextChallenge.id}`)}
            >
              다음 챌린지 도전하기
            </button>
          ) : null}

          <button className="share-copy-secondary" onClick={copyLink}>
            <Copy size={14} /> 링크 주소 복사
          </button>
        </div>
      </div>
    </Page>
  );
}

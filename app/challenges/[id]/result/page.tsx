"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Share2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";
import { comboMilestoneMessage } from "@/lib/progression";
import { answerSimilarity, charMatchRate } from "@/lib/similarity";

const initialReactions = [
  { icon: "😂", count: 0 },
  { icon: "🤯", count: 0 },
  { icon: "👏", count: 0 },
  { icon: "🤔", count: 0 },
];

function ColorizedAnswer({
  answer,
  attempt,
}: {
  answer: string;
  attempt: string;
}) {
  const normAnswer = answer.replace(/\s/g, "");
  let normIdx = 0;

  const chars = attempt.split("").map((char) => {
    if (char === " ") return { char, correct: null as boolean | null };
    const correct = normIdx < normAnswer.length && char === normAnswer[normIdx];
    normIdx++;
    return { char, correct };
  });

  return (
    <>
      &ldquo;
      {chars.map((item, i) =>
        item.correct === null ? (
          <span key={i}> </span>
        ) : (
          <span key={i} className={item.correct ? "char-correct" : undefined}>
            {item.char}
          </span>
        ),
      )}
      &rdquo;
    </>
  );
}

function ResultPreview({
  imageData,
  handwriting,
}: {
  imageData?: string;
  handwriting: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageData && !imageFailed) {
    return (
      <img
        src={imageData}
        alt="악필 이미지"
        className="result-preview-img"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="result-preview-text">
      {handwriting ? (
        <span className="handwriting">{handwriting}</span>
      ) : (
        <span className="result-preview-error">악필 이미지를 불러오지 못했어요</span>
      )}
    </div>
  );
}

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { challenges, attempts, getChallenge, signalInterest, showToast } =
    useBbiduru();
  const challenge = getChallenge(Number(params.id));
  const attempt = attempts[Number(params.id)];
  const [progressVisible, setProgressVisible] = useState(false);
  const [liked, setLiked] = useState<number[]>([]);
  const [interestSent, setInterestSent] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setProgressVisible(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  const correct = useMemo(
    () =>
      Boolean(
        challenge &&
          attempt &&
          !attempt.passed &&
          (attempt.correct || answerSimilarity(challenge.answer, attempt.answer) > 0.55),
      ),
    [attempt, challenge],
  );

  const myRate = useMemo(() => {
    if (!challenge || !attempt || attempt.passed) return 0;
    return Math.round(charMatchRate(challenge.answer, attempt.answer) * 100);
  }, [challenge, attempt]);

  useEffect(() => {
    const milestone = comboMilestoneMessage(attempt?.comboAfter ?? 0);
    if (correct && !milestone) showToast("정답이에요! 대단해요");
  }, [attempt?.comboAfter, correct, showToast]);

  if (!challenge) {
    return (
      <Page>
        <div className="page-column">
          <TopBar title="결과 공개" backHref="/challenges" />
          <div className="empty-state fill">
            <strong>결과를 찾을 수 없어요</strong>
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

  return (
    <Page>
      <div className="page-column">
        <TopBar title="결과 공개" backHref="/challenges" />
        <div className="scroll-content result-content">

          {/* 1. 악필 문제 이미지 상단 표기 */}
          <div className="card outlined result-preview">
            <ResultPreview
              key={challenge.id}
              imageData={challenge.imageData}
              handwriting={challenge.handwriting}
            />
          </div>

          {/* 2. 나의 판독 + 3. 맞춘/틀린 색상 구분 */}
          <div className="card answer-summary outlined">
            <div>
              <span>나의 판독</span>
              <strong
                className={
                  attempt && !attempt.passed ? "answer-summary-input" : undefined
                }
              >
                {!attempt || attempt.passed ? (
                  attempt ? "패스했어요 😅" : "아직 답하지 않았어요"
                ) : (
                  <ColorizedAnswer
                    answer={challenge.answer}
                    attempt={attempt.answer}
                  />
                )}
              </strong>
            </div>
          </div>

          <article className="card outlined result-card">
            <div className="answer-reveal">
              <span className="badge badge-dark">정답 공개</span>
              <h2>&ldquo;{challenge.answer}&rdquo;</h2>
            </div>
            <div className="result-details">

              {/* 5. 나의 판독 성공률 + 평균 눈금·텍스트 */}
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
                  className={`avg-label ${
                    hasCommunityAverage ? "" : "avg-label-pending"
                  }`}
                  style={{ left: hasCommunityAverage ? `${displayedAvgRate}%` : 0 }}
                >
                  <span>평균 {displayedAvgRate}%</span>
                  {!hasCommunityAverage ? (
                    <small>평균값은 참여자 5명이 모여야 집계돼요</small>
                  ) : null}
                </span>
              </div>

              {!correct && attempt ? (
                <div className="crowd-interest">
                  <button
                    className="button button-ghost button-small"
                    disabled={interestSent}
                    onClick={async () => {
                      try {
                        await signalInterest(challenge.id);
                        setInterestSent(true);
                        showToast("관심 알려주셔서 감사해요!");
                      } catch {
                        showToast("잠시 후 다시 시도해주세요");
                      }
                    }}
                  >
                    <Users size={15} />
                    {interestSent ? "응답 완료!" : "집단판독의 힘을 믿고 싶어요"}
                  </button>
                </div>
              ) : null}

              <div className="reaction-row">
                {initialReactions.map((reaction, index) => {
                  const active = liked.includes(index);
                  return (
                    <button
                      className={`reaction-chip ${active ? "liked" : ""}`}
                      key={reaction.icon}
                      onClick={() =>
                        setLiked((current) =>
                          active
                            ? current.filter((item) => item !== index)
                            : [...current, index],
                        )
                      }
                    >
                      {reaction.icon}
                      <span>{reaction.count + (active ? 1 : 0)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="divider" />

              {/* 6. '결과 공유하기' */}
              {attempt && !attempt.passed ? (
                <p className="result-xp-note">판독 참여 +5XP 획득</p>
              ) : null}
              <Link
                className="button button-primary"
                href={`/challenges/${challenge.id}/share`}
              >
                <Share2 size={17} />
                결과 공유하기
              </Link>
            </div>
          </article>

          {/* 7. 다음 챌린지 도전 */}
          <button
            className="result-next-link"
            onClick={() => router.push(`/challenges/${nextChallenge.id}`)}
          >
            다음 챌린지 도전 →
          </button>
          <p className="result-combo-note">
            {attempt && attempt.comboAfter > 0
              ? `현재 ${attempt.comboAfter}콤보 · 연속 정답 기록 중!`
              : "연속 판독해서 콤보를 획득하세요!"}
          </p>
        </div>
      </div>
    </Page>
  );
}

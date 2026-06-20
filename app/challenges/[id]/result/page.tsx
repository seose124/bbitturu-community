"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Share2, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBbiduru } from "@/components/app-provider";
import { trackAnswerRevealed, trackCrowdInterestClicked } from "@/lib/analytics";
import { Page, TopBar } from "@/components/layout";
import { comboMilestoneMessage } from "@/lib/progression";
import { answerSimilarity, charMatchRate } from "@/lib/similarity";
import { createClient } from "@/lib/supabase";
import {
  emptyReactionCounts,
  reactionOptions,
  type ReactionKey,
} from "@/lib/reactions";

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
  const [liked, setLiked] = useState<ReactionKey[]>([]);
  const [reactionCounts, setReactionCounts] = useState(emptyReactionCounts);
  const [pendingReaction, setPendingReaction] = useState<ReactionKey | null>(null);
  const [interestSent, setInterestSent] = useState(false);
  const revealTrackedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setProgressVisible(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!challenge) return;
    queueMicrotask(() => {
      setReactionCounts(challenge.reactionCounts);
      try {
        const saved = JSON.parse(
          window.localStorage.getItem(`bbitturu-reactions:${challenge.id}`) ?? "[]",
        ) as ReactionKey[];
        setLiked(
          saved.filter((key) => reactionOptions.some((item) => item.key === key)),
        );
      } catch {
        window.localStorage.removeItem(`bbitturu-reactions:${challenge.id}`);
      }
    });
  }, [challenge]);

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

  useEffect(() => {
    if (revealTrackedRef.current || !challenge || !attempt) return;
    revealTrackedRef.current = true;
    trackAnswerRevealed(challenge.id, correct, attempt.similarity);
  }, [challenge, attempt, correct]);

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

  const toggleReaction = async (key: ReactionKey) => {
    if (pendingReaction) return;
    const wasActive = liked.includes(key);
    const nextLiked = wasActive
      ? liked.filter((item) => item !== key)
      : [...liked, key];
    const previousCounts = reactionCounts;
    setLiked(nextLiked);
    setReactionCounts((current) => ({
      ...current,
      [key]: Math.max(0, current[key] + (wasActive ? -1 : 1)),
    }));
    setPendingReaction(key);

    try {
      const supabase = createClient();
      const sendReaction = (accessToken: string) =>
        fetch(`/api/challenges/${challenge.id}/reactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ reaction: key, active: !wasActive }),
        });

      let {
        data: { session },
      } = await supabase.auth.getSession();
      let response = session
        ? await sendReaction(session.access_token)
        : new Response(null, { status: 401 });

      if (response.status === 401) {
        await supabase.auth.signOut({ scope: "local" });
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.session) throw error ?? new Error("Anonymous auth failed");
        session = data.session;
        response = await sendReaction(session.access_token);
      }

      if (!response.ok) throw new Error("Reaction update failed");
      const data = (await response.json()) as { counts: typeof reactionCounts };
      setReactionCounts(data.counts);
      window.localStorage.setItem(
        `bbitturu-reactions:${challenge.id}`,
        JSON.stringify(nextLiked),
      );
    } catch {
      setLiked(liked);
      setReactionCounts(previousCounts);
      showToast("반응을 저장하지 못했어요. 다시 눌러주세요");
    } finally {
      setPendingReaction(null);
    }
  };

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

              <div className="reaction-row">
                {reactionOptions.map((reaction) => {
                  const active = liked.includes(reaction.key);
                  return (
                    <button
                      className={`reaction-chip ${active ? "liked" : ""}`}
                      key={reaction.icon}
                      type="button"
                      disabled={pendingReaction !== null}
                      onClick={() => void toggleReaction(reaction.key)}
                      aria-pressed={active}
                    >
                      {reaction.icon}
                      <span>{reactionCounts[reaction.key]}</span>
                    </button>
                  );
                })}
              </div>

              {!correct && attempt ? (
                <div className="crowd-interest">
                  <button
                    className="button button-ghost button-small"
                    disabled={interestSent}
                    onClick={async () => {
                      trackCrowdInterestClicked(challenge.id);
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

              <div className="divider" />

              {/* 6. '결과 공유하기' */}
              {attempt && !attempt.passed ? (
                <p className="result-xp-note">판독 참여 +5XP 획득</p>
              ) : null}
              <Link
                className="button button-ghost"
                href={`/challenges/${challenge.id}/share`}
              >
                <Share2 size={17} />
                결과 공유하기
              </Link>
            </div>
          </article>

          {/* 7. 다음 챌린지 도전 */}
          <button
            className="button button-accent result-next-link"
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

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";
import { answerSimilarity } from "@/lib/similarity";

const initialReactions = [
  { icon: "😂", count: 32 },
  { icon: "🤯", count: 18 },
  { icon: "👏", count: 24 },
  { icon: "🤔", count: 9 },
];

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { challenges, attempts, getChallenge, showToast } = useBbiduru();
  const challenge = getChallenge(Number(params.id));
  const attempt = attempts[Number(params.id)];
  const [progressVisible, setProgressVisible] = useState(false);
  const [liked, setLiked] = useState<number[]>([]);

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
          answerSimilarity(challenge.answer, attempt.answer) > 0.55,
      ),
    [attempt, challenge],
  );

  useEffect(() => {
    if (correct) showToast("정답! 대단해요 🎉");
  }, [correct, showToast]);

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
  const displayAnswer = attempt
    ? attempt.passed
      ? "패스했어요 😅"
      : `"${attempt.answer}"`
    : "아직 답하지 않았어요";

  return (
    <Page>
      <div className="page-column">
        <TopBar title="결과 공개" backHref="/challenges" />
        <div className="scroll-content result-content">
          <div className="card answer-summary outlined">
            <div>
              <span>내 정답</span>
              <strong>{displayAnswer}</strong>
            </div>
            <span className={`result-icon ${correct ? "correct" : "wrong"}`}>
              {correct ? <Check size={20} /> : <X size={20} />}
            </span>
          </div>

          <article className="card outlined result-card">
            <div className="answer-reveal">
              <span className="badge badge-dark">정답 공개</span>
              <h2>&ldquo;{challenge.answer}&rdquo;</h2>
            </div>
            <div className="result-details">
              <div className="result-rate-line">
                <span>판독 성공률</span>
                <strong>{challenge.successRate}%</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill success-fill"
                  style={{
                    width: progressVisible
                      ? `${challenge.successRate}%`
                      : "0%",
                  }}
                />
              </div>
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
              <Link
                className="button button-primary"
                href={`/challenges/${challenge.id}/share`}
              >
                <Share2 size={17} />
                결과 공유 · {challenge.successRate}%만 판독 성공
              </Link>
            </div>
          </article>

          <button
            className="button button-secondary"
            onClick={() => router.push(`/challenges/${nextChallenge.id}`)}
          >
            다음 챌린지 도전 →
          </button>
        </div>
      </div>
    </Page>
  );
}

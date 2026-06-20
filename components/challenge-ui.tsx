"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { trackChallengeSubmitted, trackChallengePassed } from "@/lib/analytics";
import { Check, Flame, Upload } from "lucide-react";
import { difficultyClass, type Challenge, type Difficulty } from "@/lib/challenges";
import { getKstDate } from "@/lib/progression";
import { useBbiduru } from "@/components/app-provider";
import { useRouter } from "next/navigation";

export function DifficultyBadge({
  challenge,
}: {
  challenge: Pick<Challenge, "difficulty">;
}) {
  return (
    <span className={`badge ${difficultyClass[challenge.difficulty]}`}>
      {challenge.difficulty}
    </span>
  );
}

function rateTodifficulty(successRate: number): Difficulty {
  if (successRate >= 60) return "쉬움";
  if (successRate >= 30) return "보통";
  return "어려움";
}

export function ChallengeListItem({ challenge }: { challenge: Challenge }) {
  const difficulty = rateTodifficulty(challenge.successRate);
  const rateClass =
    challenge.successRate >= 50
      ? "rate-good"
      : challenge.successRate >= 25
        ? "rate-normal"
        : "rate-hard";

  return (
    <Link className="explore-card" href={`/challenges/${challenge.id}`}>
      <div className={`explore-card-image${challenge.imageData ? " explore-card-image-photo" : ""}`}>
        {challenge.imageData ? (
          <img src={challenge.imageData} alt="악필" className="explore-card-img" />
        ) : (
          <span className="handwriting">{challenge.handwriting}</span>
        )}
      </div>
      <div className="explore-card-info">
        <div className="explore-card-summary">
          <p className="explore-card-meta">
            <strong>{challenge.author}</strong>
            <span> · {challenge.tries}명 참여</span>
          </p>
          <div className="explore-rate-block">
            <span>평균 판독률</span>
            <strong className={rateClass}>{challenge.successRate}%</strong>
          </div>
        </div>
        <div className="explore-card-tags">
          {challenge.tags.includes("hot") ? (
            <span className="explore-tag">
              <img src="/icons/icon-hot.svg" className="badge-icon" alt="" /> 인기
            </span>
          ) : null}
          <span className="explore-tag">
            <img
              src={difficulty === "쉬움" ? "/icons/icon-easy.svg" : "/icons/icon-hard.svg"}
              className="badge-icon"
              alt=""
            />
            {difficulty}
          </span>
          {challenge.tags.includes("new") ? (
            <span className="explore-tag">
              <img src="/icons/icon-new.svg" className="badge-icon" alt="" /> NEW
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function HomeChallengeCard({ challenge }: { challenge: Challenge }) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { saveAttempt, showToast } = useBbiduru();
  const router = useRouter();
  const mountTimeRef = useRef(Date.now());

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - mountTimeRef.current) / 1000);
    trackChallengeSubmitted(challenge.id, answer.trim().length, timeSpent);
    await saveAttempt(challenge.id, answer.trim());
    router.push(`/challenges/${challenge.id}/result`);
  };

  return (
    <article className="home-challenge-card">
      <div className={`home-writing${challenge.imageData ? " home-writing-image" : ""}`}>
        {challenge.imageData ? (
          <img src={challenge.imageData} alt="악필 이미지" className="home-writing-img" />
        ) : (
          <span className="handwriting">{challenge.handwriting}</span>
        )}
      </div>
      <form className="home-answer" onSubmit={submit}>
        <h3>뭐라고 쓴 건지 읽어보세요 🤔</h3>
        <input
          className="input"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="판독 결과를 입력하세요..."
          aria-label={`${challenge.author}의 악필 판독 결과`}
        />
        <div className="button-row">
          <button
            className="button button-ghost button-small"
            type="button"
            onClick={() => showToast("다음 챌린지를 도전해보세요!")}
          >
            모르겠어요 😅
          </button>
          <button
            className="button button-green button-small button-grow"
            type="submit"
            disabled={!answer.trim() || submitting}
          >
            {submitting ? "제출 중..." : "제출하기"}
          </button>
        </div>
      </form>
    </article>
  );
}

export function DailyChallengeCard({ challenge }: { challenge: Challenge }) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { attempts, stats, saveAttempt } = useBbiduru();
  const router = useRouter();
  const mountTimeRef = useRef(Date.now());
  const storedAttempt = attempts[challenge.id];
  const attempt =
    storedAttempt?.isDaily &&
    getKstDate(new Date(storedAttempt.createdAt)) === getKstDate()
      ? storedAttempt
      : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - mountTimeRef.current) / 1000);
    trackChallengeSubmitted(challenge.id, answer.trim().length, timeSpent);
    await saveAttempt(challenge.id, answer.trim());
    router.push(`/challenges/${challenge.id}/result`);
  };

  const pass = async () => {
    if (submitting) return;
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - mountTimeRef.current) / 1000);
    trackChallengePassed(challenge.id, timeSpent, answer.length > 0);
    await saveAttempt(challenge.id, "", true);
    router.push(`/challenges/${challenge.id}/result`);
  };

  return (
    <article className="daily-case-card home-challenge-card">
      <div className="daily-case-heading">
        <span className="badge badge-level">오늘의 미제</span>
        <span>
          {challenge.tries}명 도전 · 성공률 {challenge.successRate}%
        </span>
      </div>
      <div className={`home-writing${challenge.imageData ? " home-writing-image" : ""}`}>
        {challenge.imageData ? (
          <img src={challenge.imageData} alt="오늘의 미제 악필" className="home-writing-img" />
        ) : (
          <span className="handwriting">{challenge.handwriting}</span>
        )}
      </div>

      {attempt ? (
        <div className="daily-case-state">
          <span className="daily-case-complete"><Check size={18} /> 오늘의 미제 참여 완료</span>
          <strong>{attempt.correct ? "미제를 해결했어요" : "정답을 확인했어요"}</strong>
          <p>판독단 +{attempt.xpEarned} XP · 현재 {stats.currentCombo}콤보</p>
          <Link className="button button-green button-small" href={`/challenges/${challenge.id}/result`}>
            결과 다시 보기
          </Link>
        </div>
      ) : (
        <form className="home-answer" onSubmit={submit}>
          <h3>이 글씨, 정말 사람이 쓴 걸까요?</h3>
          <input
            className="input"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="판독 결과를 입력하세요..."
            aria-label="오늘의 미제 판독 결과"
          />
          <div className="button-row">
            <button
              className="button button-ghost button-small"
              type="button"
              onClick={pass}
              disabled={submitting}
            >
              모르겠어요
            </button>
            <button
              className="button button-green button-small button-grow"
              type="submit"
              disabled={!answer.trim() || submitting}
            >
              {submitting ? "판독 중..." : "미제 풀기"}
            </button>
          </div>
          <span className="daily-case-reward"><Flame size={13} /> 참여하면 판독단 +3 XP</span>
        </form>
      )}
    </article>
  );
}

export function DailyCaseEmpty() {
  return (
    <article className="daily-case-card daily-case-empty card outlined">
      <img src="/logo-symbol.png" width={40} height={40} alt="" />
      <div>
        <span className="badge badge-level">오늘의 미제</span>
        <h3>오늘의 미제를 기다리고 있어요</h3>
        <p>첫 사건을 등록하면 판독단이 모여들어요.</p>
      </div>
      <Link className="button button-green button-small" href="/upload">
        <Upload size={16} /> 악필 등록하기
      </Link>
    </article>
  );
}

export function EmptyChallenge() {
  return (
    <div className="empty-state">
      <strong>해당 챌린지가 없어요</strong>
      <span>다른 필터를 골라보세요.</span>
    </div>
  );
}

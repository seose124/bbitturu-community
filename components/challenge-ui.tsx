"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Flame, Upload } from "lucide-react";
import { difficultyClass, type Challenge, type Difficulty } from "@/lib/challenges";
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
        <p className="explore-card-meta">판독 {challenge.tries}명 · {challenge.author}</p>
        <div className="explore-card-footer">
          <div className="badge-row">
            <span className={`badge ${difficultyClass[difficulty]}`}>{difficulty}</span>
            {challenge.tags.includes("hot") ? (
              <span className="badge badge-soft">
                <img src="/icons/icon-hot.svg" className="badge-icon" alt="" /> 인기
              </span>
            ) : null}
            {challenge.tags.includes("new") ? (
              <span className="badge badge-new">
                <img src="/icons/icon-new.svg" className="badge-icon" alt="" /> NEW
              </span>
            ) : null}
          </div>
          <span className={`explore-rate ${rateClass}`}>{challenge.successRate}%</span>
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

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
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
  const { user, attempts, stats, saveAttempt } = useBbiduru();
  const router = useRouter();
  const attempt = attempts[challenge.id];
  const isOwner = Boolean(user && challenge.authorId === user.id);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    await saveAttempt(challenge.id, answer.trim());
    router.push(`/challenges/${challenge.id}/result`);
  };

  const pass = async () => {
    if (submitting) return;
    setSubmitting(true);
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

      {isOwner ? (
        <div className="daily-case-state">
          <strong>내 글씨가 오늘의 미제로 선정됐어요</strong>
          <p>판독단의 반응이 모이는 중이에요.</p>
          <Link className="button button-green button-small" href={`/profile/uploads/${challenge.id}`}>
            판독 현황 보기
          </Link>
        </div>
      ) : attempt ? (
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

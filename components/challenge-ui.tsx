"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
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
                <img src="/icon-hot.png" className="badge-icon" alt="" /> 인기
              </span>
            ) : null}
            {challenge.tags.includes("new") ? (
              <span className="badge badge-new">
                <img src="/icon-new.png" className="badge-icon" alt="" /> NEW
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
  const { saveAttempt, showToast } = useBbiduru();
  const router = useRouter();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim()) return;
    saveAttempt(challenge.id, answer.trim());
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
            disabled={!answer.trim()}
          >
            제출하기
          </button>
        </div>
      </form>
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

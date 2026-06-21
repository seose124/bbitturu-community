"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { trackChallengeSubmitted, trackChallengePassed } from "@/lib/analytics";
import { Upload } from "lucide-react";
import {
  RATE_AGGREGATION_MIN_TRIES,
  difficultyClass,
  type Challenge,
} from "@/lib/challenges";
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

export function ChallengeListItem({ challenge }: { challenge: Challenge }) {
  const { attempts, showToast } = useBbiduru();
  const completed = Boolean(attempts[challenge.id]);
  const difficulty = challenge.tags.includes("easy")
    ? "쉬움"
    : challenge.tags.includes("hard")
      ? "어려움"
      : null;
  const isRatePending = challenge.tries < RATE_AGGREGATION_MIN_TRIES;
  const rateClass =
    challenge.successRate >= 50
      ? "rate-good"
      : challenge.successRate >= 25
        ? "rate-normal"
        : "rate-hard";

  return (
    <Link
      className="explore-card"
      href={`/challenges/${challenge.id}${completed ? "/result" : ""}`}
      onClick={() => {
        if (completed) showToast("이미 판독 완료한 문제예요");
      }}
    >
      <div className={`explore-card-image${challenge.imageData ? " explore-card-image-photo" : ""}`}>
        {challenge.imageData ? (
          <img src={challenge.imageData} alt="악필" className="explore-card-img" />
        ) : (
          <span className="handwriting">{challenge.handwriting}</span>
        )}
        {completed ? (
          <div className="writing-complete-overlay" aria-hidden="true">
            <img src="/icons/icon-challenge-complete-mark-v2.png" alt="" />
            <span>판독 완료</span>
          </div>
        ) : null}
      </div>
      <div className="explore-card-info">
        <div className="explore-card-summary">
          <p className="explore-card-meta">
            <strong>{challenge.author}</strong>
            <span> · {challenge.tries}명 참여</span>
          </p>
          <div className="explore-rate-block">
            <span>평균 판독률</span>
            <strong className={isRatePending ? "rate-pending" : rateClass}>
              {isRatePending ? "집계중..." : `${challenge.successRate}%`}
            </strong>
          </div>
        </div>
        <div className="explore-card-tags">
          {challenge.tags.includes("hot") ? (
            <span className="explore-tag">
              <img src="/icons/icon-hot.svg" className="badge-icon" alt="" /> 인기
            </span>
          ) : null}
          {difficulty ? (
            <span className="explore-tag">
              <img
                src={difficulty === "쉬움" ? "/icons/icon-easy.svg" : "/icons/icon-hard.svg"}
                className="badge-icon"
                alt=""
              />
              {difficulty}
            </span>
          ) : null}
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
  const { attempts, saveAttempt, showToast } = useBbiduru();
  const router = useRouter();
  const mountTimeRef = useRef<number | null>(null);
  const completed = Boolean(attempts[challenge.id]);

  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    const timeSpent = mountTimeRef.current
      ? Math.round((Date.now() - mountTimeRef.current) / 1000)
      : 0;
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
        {completed ? (
          <div className="writing-complete-overlay" aria-hidden="true">
            <img src="/icons/icon-challenge-complete-mark-v2.png" alt="" />
            <span>판독 완료</span>
          </div>
        ) : null}
      </div>
      {completed ? (
        <div className="home-answer home-completed-state">
          <h3>판독 완료한 문제예요</h3>
          <Link
            className="button button-green button-small"
            href={`/challenges/${challenge.id}/result`}
          >
            판독 결과 보기
          </Link>
        </div>
      ) : (
        <form className="home-answer" onSubmit={submit}>
          <div className="home-challenge-meta">
            <p>
              <span>출제자</span>
              <strong>{challenge.author}</strong>
            </p>
            <p>
              <span>힌트</span>
              <strong>{challenge.hint || "등록된 힌트가 없어요"}</strong>
            </p>
          </div>
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
      )}
    </article>
  );
}

const DAILY_PROMPTS = [
  "이 악필, 과연 읽어낼 수 있을까요?",
  "판독단이라면 읽어낼 수 있어요!",
  "오늘의 미제, 해결할 수 있는 건 당신뿐",
];

export function DailyChallengeCard({ challenge, index = 0 }: { challenge: Challenge; index?: number }) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { attempts, stats, saveAttempt, showToast } = useBbiduru();
  const router = useRouter();
  const mountTimeRef = useRef<number | null>(null);
  const storedAttempt = attempts[challenge.id];
  const attempt = storedAttempt;

  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    const timeSpent = mountTimeRef.current
      ? Math.round((Date.now() - mountTimeRef.current) / 1000)
      : 0;
    trackChallengeSubmitted(challenge.id, answer.trim().length, timeSpent);
    void saveAttempt(challenge.id, answer.trim()).catch(() => {
      showToast("기록 저장에 실패했어요. 다시 시도해주세요");
    });
    router.push(`/challenges/${challenge.id}/result`);
  };

  const pass = () => {
    if (submitting) return;
    setSubmitting(true);
    const timeSpent = mountTimeRef.current
      ? Math.round((Date.now() - mountTimeRef.current) / 1000)
      : 0;
    trackChallengePassed(challenge.id, timeSpent, answer.length > 0);
    void saveAttempt(challenge.id, "", true).catch(() => {
      showToast("기록 저장에 실패했어요. 다시 시도해주세요");
    });
    router.push(`/challenges/${challenge.id}/result`);
  };

  return (
    <article className="daily-case-card home-challenge-card">
      <div className="daily-case-heading">
        <span className="badge daily-case-badge">오늘의 미제</span>
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
        {attempt ? (
          <div className="writing-complete-overlay" aria-hidden="true">
            <img src="/icons/icon-challenge-complete-mark-v2.png" alt="" />
            <span>판독 완료</span>
          </div>
        ) : null}
      </div>

      {attempt ? (
        <div className="daily-case-state">
          <strong>판독 완료한 문제예요</strong>
          <p>판독단 +{attempt.xpEarned} XP · 현재 {stats.currentCombo}콤보</p>
          <Link className="button button-ghost button-small daily-result-link" href={`/challenges/${challenge.id}/result`}>
            판독 결과 보기
          </Link>
        </div>
      ) : (
        <form className="home-answer" onSubmit={submit}>
          <h3>{DAILY_PROMPTS[index % DAILY_PROMPTS.length]}</h3>
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
        </form>
      )}
    </article>
  );
}

export function DailyCasesCarousel({ challenges }: { challenges: Challenge[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (challenges.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        setActiveIndex((i) => (i + 1) % challenges.length);
      }
    }, 3000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenges.length]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onFocusIn = () => { isPausedRef.current = true; };
    const onFocusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node)) isPausedRef.current = false;
    };
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const goTo = (idx: number) => {
    setActiveIndex(idx);
    resetTimer();
  };

  return (
    <div
      ref={carouselRef}
      className="daily-carousel-root"
    >
      {/* mobile: single-card carousel */}
      <div className="daily-carousel-mobile">
        <div className="daily-carousel-track-clip">
          <div
            className="daily-carousel-track"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {challenges.map((c, i) => (
              <div className="daily-carousel-slide" key={c.id}>
                <DailyChallengeCard challenge={c} index={i} />
              </div>
            ))}
          </div>
        </div>
        {challenges.length > 1 && (
          <div className="daily-carousel-dots">
            {challenges.map((_, i) => (
              <button
                key={i}
                className={`daily-dot${i === activeIndex ? " active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`${i + 1}번째 미제`}
              />
            ))}
          </div>
        )}
      </div>
      {/* desktop: 3-column grid */}
      <div className="daily-cases-grid">
        {challenges.map((c, i) => (
          <DailyChallengeCard challenge={c} index={i} key={c.id} />
        ))}
      </div>
    </div>
  );
}

export function DailyCaseEmpty() {
  return (
    <article className="daily-case-card daily-case-empty card outlined">
      <img src="/logo-symbol.png" width={40} height={40} alt="" />
      <div>
        <span className="badge daily-case-badge">오늘의 미제</span>
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

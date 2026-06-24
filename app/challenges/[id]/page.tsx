"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Flame, Lightbulb, Trash2 } from "lucide-react";
import {
  trackChallengeClicked,
  trackChallengeSubmitted,
  trackChallengePassed,
} from "@/lib/analytics";
import { useBbiduru } from "@/components/app-provider";
import { DifficultyBadge } from "@/components/challenge-ui";
import { Page, TopBar } from "@/components/layout";

export default function ChallengePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    user,
    challenges,
    dailyChallenge,
    stats,
    getChallenge,
    saveAttempt,
    deleteChallenge,
    showToast,
  } = useBbiduru();
  const challenge = getChallenge(Number(params.id));
  const [answer, setAnswer] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mountTimeRef = useRef<number | null>(null);
  const clickTrackedRef = useRef(false);

  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (clickTrackedRef.current || !challenge) return;
    clickTrackedRef.current = true;
    const referrer = document.referrer;
    const entrySource = !referrer
      ? "direct_url"
      : referrer.includes(window.location.origin)
        ? "feed"
        : "share_link";
    trackChallengeClicked(challenge.id, entrySource);
  }, [challenge]);

  if (!challenge) {
    return (
      <Page>
        <div className="page-column">
          <TopBar title="판독 챌린지" backHref="/challenges" />
          <div className="empty-state fill">
            <strong>챌린지를 찾을 수 없어요</strong>
            <button
              className="button button-primary button-inline"
              onClick={() => router.push("/challenges")}
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </Page>
    );
  }

  const canDelete = Boolean(user && challenge.authorId && user.id === challenge.authorId);
  const index = challenges.findIndex((item) => item.id === challenge.id);
  const progress = ((index + 1) / challenges.length) * 100;

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

  const pass = async () => {
    if (submitting) return;
    setSubmitting(true);
    const timeSpent = mountTimeRef.current
      ? Math.round((Date.now() - mountTimeRef.current) / 1000)
      : 0;
    trackChallengePassed(challenge.id, timeSpent, answer.length > 0);
    await saveAttempt(challenge.id, "", true);
    router.push(`/challenges/${challenge.id}/result`);
  };

  const handleDelete = async () => {
    if (!confirm("이 챌린지를 삭제할까요?")) return;
    setDeleting(true);
    try {
      await deleteChallenge(challenge.id);
      showToast("챌린지가 삭제됐어요");
      router.push("/challenges");
    } catch {
      showToast("삭제에 실패했어요. 다시 시도해주세요.");
      setDeleting(false);
    }
  };

  return (
    <Page>
      <div className="page-column">
        <TopBar
          title={`${index + 1} / ${challenges.length}`}
          backHref="/challenges"
          right={
            canDelete ? (
              <button
                className="icon-button"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="챌린지 삭제"
              >
                <Trash2 size={19} strokeWidth={2} />
              </button>
            ) : undefined
          }
        />
        <div className="progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="scroll-content">
          <div className="challenge-play">
          <article className="card outlined">
            <div className="challenge-stage">
              {dailyChallenge?.id === challenge.id ? (
                <span className="badge badge-level challenge-daily-badge">오늘의 미제</span>
              ) : null}
              <div className={`paper${challenge.imageData ? " paper-image" : ""}`}>
                {challenge.imageData ? (
                  <img src={challenge.imageData} alt="악필 이미지" className="paper-img" />
                ) : (
                  <span className="handwriting">{challenge.handwriting}</span>
                )}
              </div>
              <div className="author-line">
                <span>
                  출제자: <strong>{challenge.author}</strong>
                </span>
                <DifficultyBadge challenge={challenge} />
              </div>
            </div>
            <form className="challenge-form" onSubmit={submit}>
              <h2>뭐라고 쓴 건지 읽어보세요 🤔</h2>
              <input
                autoFocus
                className="input"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="판독 결과를 입력하세요..."
              />
              <div className="hint-box">
                <Lightbulb size={17} />
                <span>{challenge.hint}</span>
              </div>
              <div className="button-row">
                <button
                  className="button button-ghost button-small"
                  type="button"
                  onClick={() => void pass()}
                  disabled={submitting}
                >
                  모르겠어요
                </button>
                <button
                  className="button button-primary button-small button-grow"
                  type="submit"
                  disabled={!answer.trim() || submitting}
                >
                  {submitting ? "제출 중..." : "제출하기"}
                </button>
              </div>
            </form>
          </article>
          <div className="streak">
            <Flame size={14} fill="currentColor" /> {stats.currentCombo} 콤보 · 연속 활동 {stats.activityStreak}일
          </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

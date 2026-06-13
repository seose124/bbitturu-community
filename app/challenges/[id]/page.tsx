"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Flame, Lightbulb } from "lucide-react";
import { useBbiduru } from "@/components/app-provider";
import { DifficultyBadge } from "@/components/challenge-ui";
import { Page, TopBar } from "@/components/layout";

export default function ChallengePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { challenges, getChallenge, saveAttempt } = useBbiduru();
  const challenge = getChallenge(Number(params.id));
  const [answer, setAnswer] = useState("");

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

  const index = challenges.findIndex((item) => item.id === challenge.id);
  const progress = ((index + 1) / challenges.length) * 100;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim()) return;
    saveAttempt(challenge.id, answer.trim());
    router.push(`/challenges/${challenge.id}/result`);
  };

  const pass = () => {
    saveAttempt(challenge.id, "", true);
    router.push(`/challenges/${challenge.id}/result`);
  };

  return (
    <Page>
      <div className="page-column">
        <TopBar
          title={`${index + 1} / ${challenges.length}`}
          backHref="/challenges"
        />
        <div className="progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="scroll-content challenge-play">
          <article className="card outlined">
            <div className="challenge-stage">
              <div className="paper">
                <span className="handwriting">{challenge.handwriting}</span>
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
                  onClick={pass}
                >
                  모르겠어요 😅
                </button>
                <button
                  className="button button-primary button-small button-grow"
                  type="submit"
                  disabled={!answer.trim()}
                >
                  제출하기
                </button>
              </div>
            </form>
          </article>
          <div className="streak">
            <Flame size={14} fill="currentColor" /> 3일 연속 판독 중
          </div>
        </div>
      </div>
    </Page>
  );
}

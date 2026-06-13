"use client";

import { FormEvent, useState } from "react";
import { Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";
import type { Difficulty } from "@/lib/challenges";

const difficulties: Array<{ value: Difficulty; label: string }> = [
  { value: "쉬움", label: "😊 쉬움" },
  { value: "보통", label: "보통" },
  { value: "어려움", label: "🥵 어려움" },
  { value: "악필의 끝", label: "💀 악필의 끝" },
];

export default function UploadPage() {
  const router = useRouter();
  const { addChallenge, showToast } = useBbiduru();
  const [handwriting, setHandwriting] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("보통");
  const valid = Boolean(handwriting.trim() && answer.trim());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    addChallenge({
      handwriting: handwriting.trim(),
      answer: answer.trim(),
      difficulty,
    });
    showToast("챌린지가 공개됐어요!");
    router.push("/");
  };

  return (
    <Page className="white-page">
      <div className="page-column">
        <TopBar title="악필 업로드" backHref="/" />
        <form className="scroll-content upload-content" onSubmit={submit}>
          <div>
            <h1 className="page-heading">악필을 공개해봐요</h1>
            <p className="page-subtitle">판독단이 읽어드릴게요 😈</p>
          </div>

          <label className="field">
            <span>악필 텍스트 입력</span>
            <div className="textarea-wrap">
              <textarea
                className="input textarea"
                value={handwriting}
                onChange={(event) => setHandwriting(event.target.value)}
                placeholder="예: 오늘밥뭐먹을지모르겠다..."
                maxLength={50}
              />
              <small>{handwriting.length}/50</small>
            </div>
          </label>

          {handwriting.trim() ? (
            <div className="preview-block">
              <span className="field-label">판독단 눈에 이렇게 보여요</span>
              <div className="card preview-card outlined">
                <span className="handwriting">{handwriting}</span>
              </div>
            </div>
          ) : null}

          <div className="divider" />

          <label className="field">
            <span>실제 정답 (판독 후 공개)</span>
            <input
              className="input"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="올바른 텍스트를 입력하세요"
              maxLength={50}
            />
          </label>

          <fieldset className="field fieldset">
            <legend>예상 난이도</legend>
            <div className="difficulty-picker">
              {difficulties.map((item) => (
                <button
                  className={`filter-chip ${difficulty === item.value ? "active" : ""}`}
                  type="button"
                  key={item.value}
                  onClick={() => setDifficulty(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            className="button button-primary upload-submit"
            type="submit"
            disabled={!valid}
          >
            <Rocket size={18} /> 챌린지 공개하기
          </button>
        </form>
      </div>
    </Page>
  );
}

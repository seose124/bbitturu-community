"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ONBOARDING_KEY = "bbiduru-onboarded";

export function OnboardingCard() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
  };

  const goTo = (href: string) => {
    dismiss();
    router.push(href);
  };

  if (!visible) return null;

  return (
    <div className="onboarding-backdrop" onClick={dismiss}>
      <div className="onboarding-card" onClick={(e) => e.stopPropagation()}>
        <img src="/logo-symbol.png" className="onboarding-logo" alt="" />
        <p className="onboarding-title">환영해요! 👋</p>
        <p className="onboarding-body">
          삐뚜루는 읽기 어려운 손글씨를<br />
          함께 맞혀보는 커뮤니티예요.
        </p>
        <p className="onboarding-sub">
          다른 사람의 악필을 판독해 눈썰미를 시험하고,<br />
          내 글씨도 올려 얼마나 많은 사람이<br />
          알아보는지 확인해 보세요!<br /><br />
          어렵게 생각하지 말고,<br />
          재미로 한 번 읽어볼까요? ☺
        </p>
        <div className="onboarding-buttons">
          <button
            className="onboarding-btn onboarding-btn-ghost"
            onClick={() => goTo("/challenges")}
          >
            탐색하기
          </button>
          <button
            className="onboarding-btn onboarding-btn-primary"
            onClick={() => goTo("/upload")}
          >
            글씨 올리기
          </button>
        </div>
      </div>
    </div>
  );
}

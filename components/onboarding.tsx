"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { resetClientForPublicLaunch } from "@/lib/client-reset";

const ONBOARDING_KEY = "bbiduru-onboarded";

export function OnboardingCard() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    resetClientForPublicLaunch();
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      queueMicrotask(() => setVisible(true));
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        localStorage.setItem(ONBOARDING_KEY, "1");
        setVisible(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

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
    <div className="onboarding-backdrop" onClick={dismiss} role="presentation">
      <section
        className="onboarding-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="onboarding-content">
          <div className="onboarding-logo-frame">
            <Image
              src="/icons/onboarding-logo.svg"
              width={59}
              height={41}
              className="onboarding-logo"
              alt=""
              priority
            />
          </div>
          <div className="onboarding-copy">
            <p className="onboarding-welcome" id="onboarding-title">
              환영해요!
              <Image src="/icons/onboarding-wave.svg" width={20} height={20} alt="" />
            </p>
            <p>
              삐뚜루는 <em>읽기 어려운 손글씨를</em><br />
              <em>함께 맞혀보는 커뮤니티</em>예요.
            </p>
            <p>
              다른 사람의 <em>악필을 판독해 눈썰미를 시험</em>하고,<br />
              <em>내 글씨도 올려</em> 얼마나 많은 사람이<br />
              알아보는지 확인해 보세요!
            </p>
            <p>
              어렵게 생각하지 말고,<br />
              <span className="onboarding-final-line">
                재미로 한 번 읽어볼까요?
                <Image src="/icons/onboarding-easy.svg" width={19} height={19} alt="" />
              </span>
            </p>
          </div>
        </div>
        <div className="onboarding-buttons">
          <button
            className="onboarding-btn"
            type="button"
            onClick={() => goTo("/challenges")}
          >
            악필 판독 도전하기
          </button>
          <button
            className="onboarding-btn"
            type="button"
            onClick={() => goTo("/upload")}
          >
            내 글씨 올리기
          </button>
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Page, TopBar } from "@/components/layout";

export default function AuthSuccessPage() {
  const [next, setNext] = useState("/profile");

  useEffect(() => {
    const requestedNext = new URLSearchParams(window.location.search).get("next");
    if (requestedNext?.startsWith("/") && !requestedNext.startsWith("//")) {
      queueMicrotask(() => setNext(requestedNext));
    }
  }, []);

  return (
    <Page className="white-page">
      <div className="page-column">
        <TopBar title="로그인 완료" backHref="/" />
        <div className="scroll-content upload-success-content">
          <div className="success-icon" aria-hidden="true">
            <img src="/icon-confetti.svg" width={96} height={96} alt="" />
          </div>
          <h1 className="page-heading brand-font">기록 저장 완료!</h1>
          <p className="page-subtitle">
            이메일이 저장됐어요.
            <br />
            이제 어디서든 기록을 이어갈 수 있어요.
          </p>
          <div className="success-actions">
            <Link className="button button-primary" href={next}>
              계속하기
            </Link>
            <Link className="button button-ghost" href="/profile">
              마이페이지 보기
            </Link>
          </div>
        </div>
      </div>
    </Page>
  );
}

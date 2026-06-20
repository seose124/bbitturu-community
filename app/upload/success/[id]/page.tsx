"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useBbiduru } from "@/components/app-provider";
import { trackShareLinkCopied } from "@/lib/analytics";
import { Page, TopBar } from "@/components/layout";

export default function UploadSuccessPage() {
  const params = useParams<{ id: string }>();
  const { getChallenge, showToast } = useBbiduru();
  const challenge = getChallenge(Number(params.id));

  const copyLink = async () => {
    const url = `${window.location.origin}/challenges/${challenge?.id ?? ""}`;
    try {
      await navigator.clipboard.writeText(url);
      if (challenge) trackShareLinkCopied(challenge.id);
      showToast("링크가 복사됐어요! 🔗");
    } catch {
      showToast("링크 복사에 실패했어요");
    }
  };

  return (
    <Page className="white-page">
      <div className="page-column">
        <TopBar title="업로드 완료" backHref="/" />
        <div className="scroll-content upload-success-content">
          <div className="success-icon" aria-hidden="true">
            <img src="/icon-confetti.svg" width={96} height={96} alt="" />
          </div>
          <h1 className="page-heading brand-font">챌린지가 공개됐어요!</h1>
          <p className="page-subtitle">
            5명이 도전하면 판독 리포트를 확인할 수 있어요
            <br />
            지금 공유하거나 마이에서 천천히 확인해보세요
          </p>

          <div className="success-actions">
            <button className="button button-primary" onClick={copyLink}>
              <img src="/icons/icon-share.svg" width={18} height={18} alt="" />
              내 챌린지 공유하기
            </button>
            <Link className="button button-ghost" href={`/profile/uploads/${challenge?.id ?? ""}`}>
              판독 현황 보기
            </Link>
            <Link className="button-text" href="/profile/uploads">
              마이에서 다시 확인할 수 있어요
            </Link>
          </div>
        </div>
      </div>
    </Page>
  );
}

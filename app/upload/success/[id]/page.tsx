"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";

export default function UploadSuccessPage() {
  const params = useParams<{ id: string }>();
  const { getChallenge, showToast } = useBbiduru();
  const challenge = getChallenge(Number(params.id));

  const copyLink = async () => {
    const url = `${window.location.origin}/challenges/${challenge?.id ?? ""}`;
    try {
      await navigator.clipboard.writeText(url);
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
            판독단이 도전을 시작하면 결과를 확인할 수 있어요
            <br />
            결과가 궁금하다면 지금 공유해서 더 많이 알려보세요
          </p>

          <div className="success-actions">
            <button className="button button-primary" onClick={copyLink}>
              <img src="/icons/icon-share.svg" width={18} height={18} alt="" />
              내 챌린지 공유하기
            </button>
            <Link className="button-text" href="/challenges">
              다른 챌린지 구경하기
            </Link>
          </div>
        </div>
      </div>
    </Page>
  );
}

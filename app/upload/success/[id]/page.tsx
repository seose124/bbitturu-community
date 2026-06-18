"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Share2 } from "lucide-react";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";

export default function UploadSuccessPage() {
  const params = useParams<{ id: string }>();
  const { getChallenge } = useBbiduru();
  const challenge = getChallenge(Number(params.id));

  return (
    <Page className="white-page">
      <div className="page-column">
        <TopBar title="업로드 완료" backHref="/" />
        <div className="scroll-content upload-success-content">
          <div className="success-icon" aria-hidden="true">
            🎉
          </div>
          <h1 className="page-heading">챌린지가 공개됐어요!</h1>
          <p className="page-subtitle">
            판독단이 도전을 시작하면 결과를 확인할 수 있어요
            <br />
            결과가 궁금하다면 지금 공유해서 더 많이 알려보세요
          </p>

          <div className="success-actions">
            <Link
              className="button button-primary"
              href={challenge ? `/challenges/${challenge.id}` : "/challenges"}
            >
              <Share2 size={18} />
              내 챌린지 공유하기
            </Link>
            <Link className="button button-ghost" href="/challenges">
              다른 챌린지 구경하기
            </Link>
            <Link className="button button-primary" href="/">
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </Page>
  );
}

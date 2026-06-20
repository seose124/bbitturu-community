"use client";

import {
  Camera,
  Copy,
  Link as LinkIcon,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useBbiduru } from "@/components/app-provider";
import { trackResultShared } from "@/lib/analytics";
import { Page, TopBar } from "@/components/layout";

export default function SharePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { challenges, attempts, getChallenge, showToast } = useBbiduru();
  const challenge = getChallenge(Number(params.id));
  const attempt = challenge ? attempts[challenge.id] : undefined;
  const isCorrect = Boolean(attempt && !attempt.passed && attempt.correct);

  if (!challenge) {
    return (
      <Page dark>
        <div className="page-column">
          <TopBar title="결과 공유" backHref="/challenges" dark />
          <div className="empty-state fill dark-empty">
            <strong>공유할 결과가 없어요</strong>
          </div>
        </div>
      </Page>
    );
  }

  const currentIndex = challenges.findIndex((item) => item.id === challenge.id);
  const nextChallenge = challenges[(currentIndex + 1) % challenges.length];
  const shareUrl = `https://bbiduru.app/c/${challenge.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      trackResultShared(challenge.id, "link_copy", isCorrect);
      showToast("링크를 복사했어요");
    } catch {
      showToast("링크 복사에 실패했어요");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "삐뚜루 판독 챌린지",
          text: `${challenge.successRate}%만 판독한 악필에 도전해보세요.`,
          url: shareUrl,
        });
        trackResultShared(challenge.id, "native_share", isCorrect);
        return;
      } catch {
        return;
      }
    }
    await copyLink();
  };

  return (
    <Page dark>
      <div className="page-column">
        <TopBar
          title="결과 공유"
          backHref={`/challenges/${challenge.id}/result`}
          dark
          right={
            <button className="share-top-button" onClick={share}>
              <Share2 size={14} /> 공유
            </button>
          }
        />
        <div className="scroll-content share-content">
          <p className="share-intro">이 결과를 자랑해보세요 🔥</p>
          <article className="share-card">
            <div className="share-gradient" />
            <div className="share-card-body">
              <span className="brand-font share-brand">삐뚜루</span>
              <strong className="share-rate">{challenge.successRate}%</strong>
              <p>만 판독에 성공했어요</p>
              <div className="share-writing">
                {challenge.imageData ? (
                  <img
                    src={challenge.imageData}
                    alt="악필 이미지"
                    className="share-writing-img"
                  />
                ) : (
                  <span className="handwriting">
                    {challenge.handwriting.replace(/\n/g, " ")}
                  </span>
                )}
              </div>
              <span className="share-label">실제 정답</span>
              <strong className="share-answer">
                &ldquo;{challenge.answer}&rdquo;
              </strong>
              <span className="share-cta">
                당신도 도전할 수 있을까요? bbiduru.app →
              </span>
            </div>
          </article>

          <div className="share-options">
            <button
              className="share-option kakao"
              onClick={() => {
                trackResultShared(challenge.id, "kakao", isCorrect);
                showToast("카카오톡 공유를 준비하고 있어요");
              }}
            >
              <MessageCircle size={23} fill="currentColor" />
              <span>카카오톡</span>
            </button>
            <button
              className="share-option instagram"
              onClick={() => {
                trackResultShared(challenge.id, "instagram", isCorrect);
                showToast("인스타그램 공유를 준비하고 있어요");
              }}
            >
              <Camera size={23} />
              <span>인스타</span>
            </button>
            <button className="share-option dark-option" onClick={copyLink}>
              <LinkIcon size={23} />
              <span>링크</span>
            </button>
            <button className="share-option dark-option" onClick={share}>
              <MoreHorizontal size={23} />
              <span>더보기</span>
            </button>
          </div>

          <button
            className="button button-accent"
            onClick={() => router.push(`/challenges/${nextChallenge.id}`)}
          >
            다음 챌린지 도전하기
          </button>
          <button className="share-copy-secondary" onClick={copyLink}>
            <Copy size={14} /> 링크 주소 복사
          </button>
        </div>
      </div>
    </Page>
  );
}

"use client";

import Link from "next/link";
import { FileText, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";

function stateLabel(tries: number) {
  if (tries === 0) return "판독 기다리는 중";
  if (tries < 5) return "결과 수집 중";
  return "리포트 준비";
}

export default function UploadsPage() {
  const {
    user,
    challenges,
    notifications,
    getChallengeReport,
    deleteChallenge,
    showToast,
  } = useBbiduru();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const uploads = challenges
    .filter((challenge) => challenge.authorId === user?.id)
    .map((challenge) => ({
      challenge,
      report: getChallengeReport(challenge.id),
      unread: notifications.some(
        (notification) =>
          !notification.readAt && notification.challengeId === challenge.id,
      ),
    }))
    .sort((a, b) => Number(b.unread) - Number(a.unread));

  const removeChallenge = async (id: number) => {
    if (!window.confirm("이 챌린지와 모인 판독 결과를 모두 삭제할까요?")) return;
    setDeletingId(id);
    try {
      await deleteChallenge(id);
      showToast("업로드한 챌린지를 삭제했어요");
    } catch {
      showToast("삭제하지 못했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Page>
      <div className="page-column">
        <TopBar title="업로드한 챌린지" backHref="/profile" />
        <div className="scroll-content uploads-content">
          {uploads.length ? (
            <div className="upload-report-list">
              {uploads.map(({ challenge, report, unread }) => (
                <article
                  className="upload-report-card card outlined"
                  key={challenge.id}
                >
                  <Link
                    className="upload-report-link"
                    href={`/profile/uploads/${challenge.id}`}
                  >
                    <div className="upload-report-thumb">
                      {challenge.imageData ? (
                        <img src={challenge.imageData} alt="내가 올린 악필" />
                      ) : (
                        <span className="handwriting">{challenge.handwriting}</span>
                      )}
                    </div>
                    <div className="upload-report-info">
                      <div className="upload-report-badges">
                        <span className={`badge ${report.tries >= 5 ? "badge-level" : "badge-soft"}`}>
                          {stateLabel(report.tries)}
                        </span>
                        {unread ? <span className="badge badge-new">새 결과</span> : null}
                      </div>
                      <strong>{challenge.answer}</strong>
                      <p>
                        {report.tries}명 도전 · {report.tries ? `성공률 ${report.successRate}%` : "첫 판독을 기다려요"}
                      </p>
                    </div>
                  </Link>
                  <button
                    className="upload-report-delete"
                    type="button"
                    disabled={deletingId === challenge.id}
                    onClick={() => void removeChallenge(challenge.id)}
                    aria-label={`${challenge.answer} 챌린지 삭제`}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state fill upload-report-empty">
              <FileText size={30} />
              <strong>아직 올린 악필이 없어요</strong>
              <span className="upload-empty-copy">
                글씨 하나만 올리면 판독단의 집단 눈썰미를
                <br />
                확인할 수 있어요.
              </span>
              <Link className="button button-green button-inline" href="/upload">
                <Upload size={16} /> 첫 악필 등록하기
              </Link>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}

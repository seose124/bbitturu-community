"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";
import { answerSimilarity } from "@/lib/similarity";

export default function AttemptsPage() {
  const { attempts, challenges } = useBbiduru();
  const attemptedChallenges = Object.entries(attempts)
    .filter(([, attempt]) => !attempt.passed)
    .map(([id, attempt]) => ({
      attempt,
      challenge: challenges.find((item) => item.id === Number(id)),
    }))
    .filter(
      (item): item is typeof item & { challenge: NonNullable<typeof item.challenge> } =>
        Boolean(item.challenge),
    )
    .sort(
      (a, b) =>
        new Date(b.attempt.createdAt).getTime() -
        new Date(a.attempt.createdAt).getTime(),
    );

  return (
    <Page>
      <div className="page-column">
        <TopBar title="판독한 챌린지" backHref="/profile" />
        <div className="scroll-content attempts-content">
          {attemptedChallenges.length ? (
            <div className="attempt-list">
              {attemptedChallenges.map(({ challenge, attempt }) => (
                <article
                  className="upload-report-card card outlined"
                  key={challenge.id}
                >
                  <Link
                    className="upload-report-link"
                    href={`/challenges/${challenge.id}/result`}
                  >
                    <div className="upload-report-thumb">
                      {challenge.imageData ? (
                        <img src={challenge.imageData} alt="판독한 악필" />
                      ) : (
                        <span className="handwriting">{challenge.handwriting}</span>
                      )}
                    </div>
                    <div className="upload-report-info attempt-report-info">
                      <div className="upload-report-badges">
                        <span className="badge badge-soft">
                          판독률 {Math.round(answerSimilarity(challenge.answer, attempt.answer) * 100)}%
                        </span>
                      </div>
                      <strong>{challenge.author}의 챌린지</strong>
                      <p className="attempt-answer">내 답: {attempt.answer}</p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state fill upload-report-empty">
              <Search size={30} />
              <strong>아직 판독한 챌린지가 없어요</strong>
              <span>어려운 악필을 읽고 첫 판독을 남겨보세요.</span>
              <Link className="button button-green button-inline" href="/challenges">
                챌린지 보러 가기
              </Link>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}

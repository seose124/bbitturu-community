import Link from "next/link";
import Image from "next/image";
import { Page, TopBar } from "@/components/layout";

export default function CompletedChallengesPage() {
  return (
    <Page>
      <div className="page-column">
        <TopBar title="판독 완료" backHref="/challenges" />
        <div className="scroll-content challenge-complete-content">
          <section className="card outlined challenge-complete-card">
            <span className="challenge-complete-logo">
              <Image
                src="/logo-symbol.png"
                width={56}
                height={56}
                alt=""
                className="challenge-complete-logo-img"
              />
            </span>
            <div>
              <strong>대단해요, 등록된 악필을 모두 판독했어요!</strong>
              <p>이번엔 악필을 등록해보시는 건 어때요?</p>
            </div>
            <div className="challenge-complete-actions">
              <Link className="button button-primary" href="/upload">
                나의 악필 등록하기
              </Link>
              <Link className="button button-ghost" href="/">
                홈으로 이동
              </Link>
            </div>
          </section>
        </div>
      </div>
    </Page>
  );
}

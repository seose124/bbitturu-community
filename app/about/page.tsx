import { InfoPage, InfoSection } from "@/components/info-page";

export default function AboutPage() {
  return (
    <InfoPage title="삐뚜루 소개">
      <div className="about-hero">
        <div className="brand-font">삐뚜루</div>
        <p>
          악필 판독 커뮤니티
          <br />
          읽히지 않는 글씨를 함께 해석해요
        </p>
        <span>v1.0.0 Beta</span>
      </div>
      <div className="about-copy">
        <InfoSection title="서비스 소개">
          <p>
            삐뚜루는 읽기 어려운 손 글씨를 함께 판독하는 커뮤니티
            서비스예요. 악필로 쓴 메모나 메시지를 올리면, 판독단이 무슨
            글씨인지 맞춰보는 재미있는 경험을 제공해요.
          </p>
        </InfoSection>
        <InfoSection title="핵심 기능">
          <ul>
            <li>악필 업로드: 내 글씨를 공개하고 커뮤니티에 도전과제 등록</li>
            <li>판독 챌린지: 다른 사람의 글씨를 읽어보는 게임</li>
            <li>판독률 통계: 얼마나 많은 사람이 성공했는지 확인</li>
            <li>결과 공유: SNS에 판독 결과 자랑하기</li>
          </ul>
        </InfoSection>
        <InfoSection title="판독 레벨 시스템">
          <ul>
            <li>삐뚤이: 판독 입문자 (0~49회)</li>
            <li>판독단: 꾸준한 판독러 (50~199회)</li>
            <li>판독사: 악필 전문가 (200~499회)</li>
            <li>판독왕: 전설의 판독러 (500회 이상)</li>
          </ul>
        </InfoSection>
        <InfoSection title="만든 사람들">
          <p>
            삐뚜루는 악필로 인한 소통의 불편함을 유머로 승화시키고
            싶었던 팀이 만들었어요.
          </p>
          <p>문의: hello@bbiduru.app</p>
        </InfoSection>
      </div>
    </InfoPage>
  );
}

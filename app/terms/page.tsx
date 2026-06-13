import { InfoPage, InfoSection } from "@/components/info-page";

export default function TermsPage() {
  return (
    <InfoPage title="이용약관" date="시행일: 2025년 1월 1일">
      <InfoSection title="제1조 목적">
        <p>
          본 약관은 삐뚜루가 제공하는 악필 판독 커뮤니티 서비스의 이용
          조건과 절차, 이용자와 서비스 간의 권리·의무·책임사항을
          규정합니다.
        </p>
      </InfoSection>
      <InfoSection title="제2조 서비스 이용">
        <ul>
          <li>서비스는 만 14세 이상 누구나 이용할 수 있습니다.</li>
          <li>이용자는 회원가입 시 정확한 정보를 입력해야 합니다.</li>
          <li>계정 및 비밀번호 관리 책임은 이용자에게 있습니다.</li>
        </ul>
      </InfoSection>
      <InfoSection title="제3조 금지 행위">
        <ul>
          <li>타인의 개인정보 도용 또는 허위 정보 등록</li>
          <li>타인을 비방하거나 명예를 훼손하는 콘텐츠 등록</li>
          <li>음란, 폭력, 혐오 등 불법·유해 콘텐츠 등록</li>
          <li>서비스의 정상적인 운영을 방해하는 행위</li>
          <li>저작권 등 지적재산권 침해 행위</li>
          <li>영리 목적의 무단 광고·홍보 행위</li>
        </ul>
      </InfoSection>
      <InfoSection title="제4조 콘텐츠 권리">
        <p>
          이용자가 업로드한 악필 이미지 및 텍스트의 저작권은 이용자에게
          있습니다. 서비스는 운영, 홍보, 개선 목적으로 해당 콘텐츠를
          활용할 수 있습니다.
        </p>
      </InfoSection>
      <InfoSection title="제5조 서비스 변경 및 중단">
        <p>
          운영상·기술상의 이유로 서비스 내용을 변경하거나 중단할 수
          있습니다. 이 경우 원칙적으로 사전에 공지합니다.
        </p>
      </InfoSection>
      <InfoSection title="제6조 책임의 제한">
        <p>
          서비스는 이용자 간 분쟁에 개입할 의무가 없으며, 고의 또는
          중과실이 없는 한 이용 중 발생한 손해를 책임지지 않습니다.
        </p>
      </InfoSection>
      <InfoSection title="제7조 분쟁 해결">
        <p>
          서비스 이용으로 발생한 분쟁은 대한민국 법령을 준거법으로 하며,
          관할 법원은 민사소송법의 규정에 따릅니다.
        </p>
      </InfoSection>
    </InfoPage>
  );
}

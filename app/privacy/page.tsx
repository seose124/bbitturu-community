import { InfoPage, InfoSection } from "@/components/info-page";

export default function PrivacyPage() {
  return (
    <InfoPage title="개인정보 처리방침" date="시행일: 2026년 6월 18일">
      <p className="info-intro">
        삐뚜루(이하 &ldquo;서비스&rdquo;)는 개인정보보호법 등 관련 법령을
        준수하며, 이용자의 개인정보 보호를 최우선으로 합니다.
      </p>
      <InfoSection title="제1조 수집하는 개인정보 항목 및 수집 방법">
        <p>서비스는 다음의 개인정보를 수집합니다.</p>
        <ul>
          <li>필수: 이메일 주소, 닉네임</li>
          <li>자동 수집: 서비스 이용 기록, 접속 로그, IP 주소, 기기 정보</li>
          <li>수집 방법: 회원가입 시 직접 입력, 이용 과정에서 자동 생성</li>
        </ul>
      </InfoSection>
      <InfoSection title="제2조 개인정보 수집 및 이용 목적">
        <ul>
          <li>악필 챌린지 및 판독 기능 제공</li>
          <li>이용자 식별과 본인 확인</li>
          <li>서비스 개선을 위한 통계 분석</li>
          <li>불법·부정 이용 방지 및 보안 관리</li>
          <li>문의 응대 및 공지사항 안내</li>
        </ul>
      </InfoSection>
      <InfoSection title="제3조 개인정보 보유 및 이용 기간">
        <p>
          서비스 탈퇴 시 또는 개인정보 수집·이용 목적 달성 시 즉시
          파기합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간
          동안 보관합니다.
        </p>
        <ul>
          <li>소비자 불만·분쟁처리 기록: 3년</li>
          <li>접속 로그: 3개월</li>
        </ul>
      </InfoSection>
      <InfoSection title="제4조 개인정보 제3자 제공">
        <p>
          이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만
          이용자 동의 또는 법령에 의한 경우는 예외로 합니다.
        </p>
      </InfoSection>
      <InfoSection title="제5조 쿠키 운용 및 거부">
        <p>
          맞춤형 서비스 제공을 위해 쿠키를 사용합니다. 브라우저 설정에서
          저장을 거부할 수 있으며 일부 기능이 제한될 수 있습니다.
        </p>
      </InfoSection>
      <InfoSection title="제6조 이용자 권리">
        <p>
          이용자는 언제든 개인정보 열람, 정정, 삭제, 처리정지를 요청할 수
          있습니다.
        </p>
      </InfoSection>
    </InfoPage>
  );
}

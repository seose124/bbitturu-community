# 삐뚜루 MVP

악필을 함께 판독하는 커뮤니티 서비스의 Next.js MVP입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## 구성

- Next.js App Router
- TypeScript
- 반응형 모바일 앱 셸
- 챌린지 탐색, 풀이, 결과, 공유
- 악필 업로드와 로컬 저장
- 프로필, 소개, 약관, 개인정보 처리방침, 관리자 문의

## 재방문 시스템 배포

레벨, 연속 활동일, 오늘의 미제, 판독 리포트와 알림은
`supabase/migrations/202606190001_retention_system.sql` 스키마를 사용합니다.

코드 배포 전에 Supabase SQL Editor에서 마이그레이션을 실행하거나,
Supabase CLI가 연결된 환경에서는 다음 명령으로 반영합니다.

```bash
supabase db push
```

마이그레이션 적용 전에도 익명 사용자의 진행 상태는 브라우저에 보존되지만,
여러 기기 간 기록 동기화와 리포트 알림은 마이그레이션 적용 후 활성화됩니다.

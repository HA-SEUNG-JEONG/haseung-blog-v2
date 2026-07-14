# 전체 블로그 초기 구현 (Next.js + Supabase)

**날짜**: 2026-07-14
**유형**: feat
**관련 파일**: `app/**`, `components/**`, `lib/supabase/**`, `proxy.ts`, `supabase/schema.sql`

## 변경 내용

빈 저장소에서 개인 단일 저자 블로그 전체를 구현. 마크다운 글쓰기·이미지/영상 첨부·
초안·백데이팅·조회수·검색·다크모드·댓글 토글·자동저장·실시간 프리뷰를 최소 의존성으로
커버하기 위해 Next.js 16(App Router) + Supabase(Postgres/Storage/Auth) 조합 선택.
에디터 라이브러리 없이 `<textarea>` + 공용 `Markdown` 컴포넌트로 프리뷰와 공개 페이지
렌더링을 동일 파이프라인으로 유지(드리프트 제로).

## 주요 구현 사항

- **DB/보안**: `posts` 단일 테이블 + RLS(익명은 published만, authenticated는 전체).
  Supabase에서 회원가입 비활성화 = 단일 관리자 allowlist. 조회수는 `increment_view`
  security-definer RPC로 원자 증가.
- **공개 페이지**: `/`(발행글 목록), `/posts/[slug]`(react-markdown + gfm + raw HTML +
  highlight, Giscus는 `comments_enabled`일 때만), `/search`(ILIKE, `%,()` 제거 후 `.or()`).
- **관리자**: `proxy.ts`(Next 16에서 middleware 대체)로 `/admin/:path*` 세션 갱신+가드.
  서버 액션(`app/admin/actions.ts`)으로 생성/수정/발행/삭제 — 수정은 컬럼 allowlist로
  `view_count` 등 보호.
- **에디터**: 1.5초 디바운스 자동저장(제목/슬러그/본문만, 언마운트 시 flush),
  datetime-local로 `published_at` 백데이팅, 붙여넣기/드롭 업로드(Storage `uploads` 버킷,
  이미지는 `![]()`, 영상은 `<video controls>`), 분할 프리뷰.
- **조회수**: 클라이언트 컴포넌트가 sessionStorage 가드로 세션당 1회 RPC 호출.
- **테마/GA**: next-themes(class 전략, Tailwind v4 `@custom-variant dark`) +
  CSS-only 토글 아이콘(hydration mismatch 회피), `@next/third-parties` GA4.

## 검증

- `npm run build` / `npm run lint` 클린 통과.
- 스모크 테스트: `/` 200(빈 목록), `/admin` → 307 `/admin/login`, 없는 글 404,
  `/search` 200, 테마 스크립트·네비바 렌더 확인.
- 실 Supabase 연동 검증은 프로젝트 생성 후 필요 (README 수동 설정 참고).

## 관련 커밋

(아직 커밋 없음 — 초기 구현 전체가 워킹 트리에 있음)

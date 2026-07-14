# 블로그 피드백 전체 수정 (SEO·slug 검증·에디터 프리뷰 분리)

**날짜**: 2026-07-14
**유형**: feat / fix
**관련 파일**: `app/sitemap.ts`, `app/robots.ts`, `app/not-found.tsx`, `app/posts/[slug]/page.tsx`, `app/layout.tsx`, `app/page.tsx`, `app/search/page.tsx`, `app/admin/actions.ts`, `app/admin/page.tsx`, `app/admin/login/page.tsx`, `app/admin/edit/[id]/preview/page.tsx`, `components/Editor.tsx`, `components/Navbar.tsx`, `components/SearchInput.tsx`, `components/ConfirmButton.tsx`, `components/SubmitButton.tsx`, `components/ViewCounter.tsx`, `lib/posts.ts`, `lib/text.ts`, `supabase/schema.sql`

## 변경 내용

리뷰에서 발견된 공백 일괄 수정. SEO 레이어가 전무해 검색 노출이 불가능했고, slug가 자동 생성값(`draft-*`) 그대로 발행되며, delete가 원클릭이고 서버 액션 실패가 조용히 무시되던 문제.

## 주요 구현 사항

- **SEO**: `generateMetadata`(title/description/og — description은 `stripMarkdown`으로 본문에서 추출), `metadataBase` + title template, `sitemap.ts`, `robots.ts`(`/admin` 차단). `NEXT_PUBLIC_SITE_URL` 환경변수 신설.
- **예약 발행**: 홈·검색·글 페이지·sitemap에 `published_at <= now()` 필터. 미래 날짜 글은 그 시각까지 숨김(404).
- **slug 가드**: 자유 작성 유지(한글/공백 허용). 최소 가드만 — 빈 값 금지, `/` 금지, unique 위반(23505) 시 "slug already exists", 발행 시 `draft-*` slug confirm.
- **에디터 프리뷰 분리**: 2단 그리드 제거, 전체폭 단일 컬럼. "Preview ↗"가 flush save 후 `/admin/edit/[id]/preview` 새 탭 오픈(팝업 차단 회피 위해 동기 `window.open` 후 URL 주입). `beforeunload` 미저장 가드 추가.
- **파괴적 액션 보호**: Delete에 `ConfirmButton`(confirm 후 submit). publish/unpublish/delete 실패 시 `/admin?error=` 배너 표시.
- **검색**: LIKE 와일드카드(`%`, `_`, `\`) 이스케이프 — 이전엔 `_`가 임의 문자 매칭으로 누출. `,()` 제거는 PostgREST `or()` 문법 보호용으로 유지.
- **뷰카운터**: 관리자 세션이면 increment skip.
- **404 상태코드**: 루트 `loading.tsx`가 스트리밍으로 헤더를 먼저 커밋해 없는 글이 HTTP 200(soft 404)으로 나가는 문제 확인 → `loading.tsx` 제거(클라이언트 네비게이션은 loading boundary 없어도 이전 화면이 유지되므로 손실 없음), `generateMetadata`에서 `notFound()` 호출.
- **기타**: 홈 목록 발췌(`line-clamp-2`), 푸터(GitHub 링크), 검색 인풋 분리(`SearchInput` — q 프리필, aria-label, 모바일 `w-28`), 로그인 실패 시 email 프리필 + pending 버튼, `increment_view`에 `set search_path = public`(기존 DB는 dashboard에서 재실행 필요 — schema.sql 하단 MIGRATION 주석 참조).

## 관련 커밋

(uncommitted — 작업 트리 상태에서 문서화)

# AGENTS.md(web-interface-guidelines) 준수 개선 + UI 카피 한국어 통일

**날짜**: 2026-07-15
**유형**: feat / fix
**관련 파일**: `AGENTS.md`, `app/globals.css`, `app/layout.tsx`, `app/actions.ts`, `app/page.tsx`, `app/search/page.tsx`, `app/not-found.tsx`, `app/posts/[slug]/page.tsx`, `app/admin/login/page.tsx`, `components/Editor.tsx`, `components/Markdown.tsx`, `components/Navbar.tsx`, `components/SearchInput.tsx`, `components/PostAdminBar.tsx`, `components/SubmitButton.tsx`, `components/ConfirmButton.tsx`, `components/ConfirmDialog.tsx`, `components/ThemeToggle.tsx`, `lib/text.ts`

## 변경 내용

`AGENTS.md`(vercel-labs/web-interface-guidelines) 기준으로 전체 UI를 감사한 결과 MUST 11건 + SHOULD 6건 위반. 접근성·모바일 사용성이 실제로 깨지는 항목들이라 일괄 수정.

카피는 dialog만 한국어, 나머지는 영어로 섞여 있었음 → 전부 한국어로 통일하고 그 규칙을 `AGENTS.md`에 명문화(코드 식별자·`slug`·기술 토큰은 영어 유지).

## 주요 구현 사항

### 접근성

- **skip link**: `<body>` 최상단에 "본문으로 건너뛰기"(`sr-only focus:not-sr-only`), `<main id="main">`. 툴바 버튼이 많아 키보드 사용자가 본문까지 가는 비용이 컸음.
- **inline slug 에러**: 기존엔 slug 충돌이 상단 status pill에만 떠서 어느 필드 문제인지 알 수 없었음. `updatePost` 반환 타입을 `string | null` → `{ field: "slug" | null; message: string } | null`로 바꿔 에러를 필드에 귀속. slug input 아래 렌더 + `aria-invalid`/`aria-describedby` + 에러 시 해당 input으로 focus 이동. (문자열 prefix 검사는 메시지를 한국어로 바꾸는 순간 깨지므로 구조화가 필요했음.)
- **aria-live**: 저장/업로드 status 영역에 `role="status" aria-live="polite"`. 조건부 렌더 대신 항상 존재하는 region으로 바꿔야 스크린리더가 변경을 읽음.
- **accessible name**: 툴바·업로드·프리뷰·테마 토글 버튼에 `aria-label`(아이콘만 있는 버튼들).
- **focus ring**: textarea의 `focus:outline-none`(대체 없음) → `focus-visible:outline-2`.

### 모바일

- **iOS 줌 방지**: 16px 미만 input은 포커스 시 iOS Safari가 확대함 → slug·datetime-local·textarea·검색 input을 `text-base sm:text-sm`로.
- **hit target**: 툴바 버튼 `inline-flex h-7 min-w-7`(28px ≥ 24px 기준).
- **프리뷰 교체 모드**: 375px에서 2단 분할은 양쪽 다 못 쓰는 폭 → `sm` 미만에선 프리뷰가 에디터를 교체.
- **navbar `flex-wrap`**: 로그인 상태(새 글/로그아웃 추가)에서 375px 가로 스크롤 발생하던 것 해소.
- **`touch-action: manipulation`**(body): double-tap zoom 지연 제거.

### 그 외

- **dark mode `color-scheme: dark`**: `datetime-local` 피커, 체크박스, search clear-X, 스크롤바가 다크에서 흰색으로 튀던 문제.
- **`theme-color` viewport**: 브라우저 크롬 색을 페이지 배경과 일치.
- **pending 상태**: `SubmitButton`이 라벨을 "…"로 갈아치우던 것 → 라벨 유지 + 스피너(`motion-reduce:animate-none`). `PostAdminBar` 발행/발행 취소를 `SubmitButton`으로 교체, 삭제는 `ConfirmButton` 내부 `useFormStatus()`로 중복 제출 차단.
- **로케일 날짜**: `published_at?.slice(0, 10)`(ISO 노출) → `lib/text.ts`의 `formatDate` (`Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "Asia/Seoul" })`). 타임존 고정이라 hydration mismatch 없음. 조회수엔 `tabular-nums`.
- **검색 `<title>`**: `generateMetadata`로 `"${q}" 검색 결과` — 탭 제목이 컨텍스트를 반영하지 않던 MUST 위반.
- **preview 상태 URL 반영**(SHOULD): `?edit=1&preview=1`. 초기값은 서버 페이지가 이미 await하는 `searchParams`에서 prop으로 전달(`useSearchParams` + Suspense 불필요). 토글은 slug 리네임과 동일하게 `history.replaceState`로 갱신 — 에디터 리마운트 방지.
- **이미지 lazy-load**: `Markdown`의 `img`에 `loading="lazy" decoding="async"`.
- **modal `overscroll-contain`**, 로그인 이메일 `autoFocus` + `autoComplete`.

## 알려진 한계

- **CLS**: 업로드 시 이미지 width/height를 저장하지 않아 `loading="lazy"`만으로는 레이아웃 시프트가 남음. 완전 해소하려면 업로드 파이프라인에서 치수를 함께 저장해야 함 (`components/Markdown.tsx`의 `ponytail:` 주석 참조).
- 375px 뷰포트 실측은 브라우저 자동화에서 viewport 리사이즈가 먹지 않아 미확인. DevTools device mode 수동 확인 권장.

## 검증

- `npm run lint` / `npm run build` 통과.
- 브라우저(로그인 세션): 다크 모드 `color-scheme: dark` 적용 확인, skip link 포커스 시 노출, 툴바 버튼 28×28 + 한국어 accessible name, aria-live status, slug 비우고 blur → 인라인 에러 + focus 복귀 + URL 롤백, 프리뷰 토글 `?preview=1`, 삭제 confirm 다이얼로그.

## 관련 커밋

(작업 트리 상태에서 문서화 — 이 문서와 함께 커밋)

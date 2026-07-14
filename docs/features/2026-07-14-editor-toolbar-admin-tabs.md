# 마크다운 에디터 툴바 + Admin Draft 탭 분리

**날짜**: 2026-07-14
**유형**: feat
**관련 파일**: `components/Editor.tsx`, `app/admin/page.tsx`

## 변경 내용

Admin 에디터가 순수 textarea + 프리뷰뿐이라 포맷팅이 불편했다. 새 라이브러리 없이
포맷팅 툴바·키보드 단축키·시각 폴리시를 추가했다. 또한 `/admin` 목록이 draft와
published를 한 리스트에 섞어 보여줘서 구분이 어려웠던 것을 쿼리 파라미터 기반
탭(`/admin?tab=drafts`)으로 분리했다.

## 주요 구현 사항

### Editor.tsx — 툴바 + 폴리시

- 툴바 버튼: 굵게(`**`)·기울임(`*`)·취소선(`~~`)·H2·H3·링크·인라인 코드·코드 블록·인용·목록·이미지 업로드
- `wrapSelection(before, after, placeholder)`: 선택 텍스트 감싸기, 선택 없으면 placeholder 삽입, `requestAnimationFrame`으로 포커스·선택 복원
- `prefixLines(prefix)`: 선택 영역 줄 단위 prefix 토글 (인용/목록/헤딩) — 전체 줄에 prefix 있으면 제거, 없으면 추가
- 단축키: Cmd/Ctrl+B(굵게), Cmd/Ctrl+I(기울임), Cmd/Ctrl+K(링크)
- 이미지 버튼: 숨김 `<input type="file" accept="image/*,video/*">` 클릭, 기존 `uploadFiles()` 재사용 (paste/drop과 동일 경로)
- 툴바 컨테이너 `onMouseDown` preventDefault로 textarea 포커스·선택 유지
- 스타일: 에디터/프리뷰 pane 라벨 헤더("Markdown"/"Preview"), `rounded-lg`, 프리뷰 `bg-neutral-50 dark:bg-neutral-900`, 제목 input border-b만 남기고 `text-2xl font-bold`, 상태 표시 pill 스타일

### app/admin/page.tsx — Published/Drafts 탭

- Next.js 15 `searchParams: Promise<{ tab?: string }>` await 처리
- 전체 fetch 유지 후 JS로 분리 — 탭별 카운트를 추가 쿼리 없이 표시
- `Published (n)` / `Drafts (n)` 링크 탭, 활성 탭 밑줄 강조
- 탭별 빈 목록 메시지 분리

## 검증

- `npm run build` 통과
- Chrome 실기 확인: 탭 전환·카운트, 툴바 B 버튼(`**` 감싸기 + 선택 복원), Cmd+I/K 단축키, H2 prefix 토글(적용/해제), 프리뷰 `<strong>` 렌더링, 자동저장 pill, 다크 모드 스타일
- 이미지 버튼은 네이티브 파일 다이얼로그라 자동화 확인 생략 — 업로드 경로는 기존 paste/drop과 동일한 `uploadFiles()` 재사용

## 관련 커밋

(커밋 전 — 작성 시점 미커밋 변경)

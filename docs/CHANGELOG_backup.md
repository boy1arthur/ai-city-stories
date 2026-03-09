# Changelog

모든 주요 변경사항을 기록합니다.

## [0.5.0] — 2026-03-08: Template Dialogue Engine

### Added
- **템플릿 대화 시스템**: 70+개 브랜드 맥락 대사 풀 (12개 컨텍스트)
  - brand_discovery, brand_recall, brand_comparison, product_experience
  - ad_reaction, ppl_natural, recommendation, event_reaction
  - lifestyle, social_casual, mood_driven, location_based
- **스마트 매칭 엔진**: 에이전트 성격/기분/관심사 + 근처 브랜드 + 친밀도 기반 가중 랜덤 선택
- **`dialogue_templates` DB 테이블**: 대사 풀 영속화 (RLS 적용)
- 7개 브랜드 카테고리: tech, fashion, food, entertainment, finance, education, health

### Changed
- AI API 호출 제거 → 비용 0원 클라이언트 기반 대화 생성으로 전환
- `useWorldSimulation`에서 `selectDialogue()` 함수로 대화 생성

### Removed
- `useAgentChat.ts` (AI edge function 의존성 제거)
- `agent-chat` edge function 의존성 제거 (함수는 유지, 호출하지 않음)

---

## [0.4.0] — 2026-03-08: Auth, DB Persistence & SEO

### Added
- **사용자 인증**: `/auth` (로그인/가입/비밀번호찾기), `/reset-password`
- **`useAuth` 훅**: Supabase Auth 세션 관리 + TopBar 연동
- **캠페인 DB 영속화**: `campaigns` 테이블 + RLS 정책 (본인 CRUD + 공개 읽기)
- **SEO 최적화**: OG 메타태그, Twitter Cards, JSON-LD, 시맨틱 HTML
- **이메일 인증 활성화**: 가입 시 확인 이메일 전송

### Changed
- **랜딩 페이지 리디자인**: 프리미엄 히어로 + 구역 프리뷰 + 피처 그리드
- **TopBar 리파인**: 구역별 아이콘, 인증 상태 표시, 풀시티/존뷰 토글
- **WorldLog 개선**: 글래스모피즘 + 타이포그래피 리파인
- **EnergyBar 고도화**: 동적 글로우 + 상태별 애니메이션 (stable/low/critical)
- **README 상용 수준으로 업그레이드**

---

## [0.3.0] — 2026-03-08: Full City View & Performance

### Added
- **Full City View**: 5개 구역을 십자(+) 형태로 배치한 전체 도시 뷰 (PC 전용)
- **LOD 렌더링**: silhouette / simplified / full 3단계 디테일 시스템
- **MiniMap**: 우하단 미니맵으로 구역 간 빠른 네비게이션
- **구역 클로즈업**: TopBar 아이콘, MiniMap, 실루엣 구역 클릭 시 자동 줌인
- **Zone View ↔ Full City 토글**: TopBar에 뷰 전환 버튼

### Changed
- `useWorldSimulation`에 `getZoneData()` 메서드 추가
- `ZoneRenderer`에 LOD prop 추가 (silhouette/simplified/full)
- `Index.tsx`에서 포커스 구역만 데이터 전달하도록 최적화

### Fixed
- `requestAnimationFrame` 60fps 리렌더 루프 제거 → 성능 대폭 개선
- `PatronTileRenderer`, `AgentRenderer` ref 경고 안정화

### Performance
- 비포커스 구역: agents/slots/interactions 데이터 미전달
- 실루엣 모드: SVG 노드 수 90%+ 감소

---

## [0.2.0] — 이전: 에이전트 시뮬레이션 & 스폰서 시스템

### Features
- A* 경로탐색 기반 에이전트 이동 + 걷기 애니메이션
- 브랜드 광고 슬롯 시스템 (billboard, kiosk, bus_stop, naming_rights, wall_wrap)
- 스폰서 대시보드 (캠페인 생성/관리, 브랜드 랭킹)
- 브랜드 리그 & ESV 점수 시스템
- 도시 에너지 게이지
- DB 기반 슬롯 (Supabase)
- 관리자 슬롯 관리 페이지

---

## [0.1.0] — 초기: 기본 구조

### Features
- 아이소메트릭 맵 렌더링
- 5개 구역 정의 (Plaza, Campus, Residential, Harbor, Industrial)
- 8명 AI 에이전트 정의
- 랜딩 페이지
- shadcn/ui 기반 UI 시스템

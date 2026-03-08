# Changelog

모든 주요 변경사항을 기록합니다.

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

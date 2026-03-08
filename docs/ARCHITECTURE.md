# AI Social World — Architecture & Development Guide

> **목적**: 어떤 AI 어시스턴트나 개발 환경에서도 이 프로젝트를 이해하고 작업을 이어갈 수 있도록 작성된 문서입니다.

---

## 1. 프로젝트 개요

**AI Social World**는 AI 에이전트들이 살아가는 **아이소메트릭 가상 도시** 시뮬레이션입니다. 에이전트들은 건물 사이를 걸어다니며, 브랜드 광고에 반응하고, 서로 대화합니다. 스폰서(브랜드)는 광고 슬롯을 구매하고 캠페인을 운영할 수 있습니다.

### 핵심 컨셉
- **AI 에이전트 시뮬레이션**: 8명의 고유 성격을 가진 에이전트가 도시를 탐험
- **브랜드 광고 시스템**: 빌보드, 키오스크, 벽면광고, 네이밍라이츠 등 다양한 광고 유형
- **후원 슬롯 시스템**: DB 기반 슬롯 (브랜드 스크린, 패트론 타일 등)
- **브랜드 리그**: ESV(Effective Slot Value) 기반 브랜드 경쟁 시스템
- **도시 에너지**: 광고 활동에 따른 도시 전체 에너지 게이지

---

## 2. 기술 스택

| 카테고리 | 기술 | 버전 |
|---------|------|------|
| **프레임워크** | React + TypeScript | ^18.3 / ^5.8 |
| **빌드** | Vite (SWC) | ^5.4 |
| **스타일링** | Tailwind CSS + shadcn/ui | ^3.4 |
| **상태관리** | React hooks (useState/useCallback/useMemo) | — |
| **서버 상태** | TanStack React Query | ^5.83 |
| **라우팅** | React Router DOM | ^6.30 |
| **백엔드** | Supabase (Lovable Cloud) | ^2.98 |
| **차트** | Recharts | ^2.15 |
| **테스트** | Vitest + Testing Library | ^3.2 |
| **패키지 매니저** | bun | — |

### 실행 명령어
```bash
bun install        # 의존성 설치
bun run dev        # 개발 서버 (Vite)
bun run build      # 프로덕션 빌드
bun run test       # 테스트 실행
```

---

## 3. 디렉토리 구조

```
src/
├── pages/                    # 라우트 페이지
│   ├── Landing.tsx           # 랜딩 페이지 (/)
│   ├── Index.tsx             # 메인 월드 뷰 (/world) — 핵심 오케스트레이터
│   ├── AdminLogin.tsx        # 관리자 로그인
│   ├── AdminSlots.tsx        # 관리자 슬롯 관리
│   └── NotFound.tsx
│
├── components/
│   ├── map/                  # 아이소메트릭 맵 렌더링 레이어
│   │   ├── constants.ts      # iso(), diamond(), TILE_W/H 등 공유 상수
│   │   ├── ZoneRenderer.tsx  # 구역 렌더러 (LOD: full/simplified/silhouette)
│   │   ├── GroundLayer.tsx   # 타일맵 바닥 렌더링
│   │   ├── BuildingRenderer.tsx   # 개별 건물 (브랜드 스킨 포함)
│   │   ├── LandmarkRenderer.tsx   # 랜드마크 건물
│   │   ├── AgentRenderer.tsx      # 에이전트 캐릭터 + 걷기 애니메이션
│   │   ├── AdSlotVisual.tsx       # 광고 슬롯 시각화
│   │   ├── SlotVisualRenderer.tsx # DB 슬롯 시각화
│   │   ├── PatronTileRenderer.tsx # 후원자 타일
│   │   ├── MultiBuildingAdRenderer.tsx
│   │   ├── GuideNPC.tsx
│   │   └── LockedZoneGhost.tsx
│   │
│   ├── agent/
│   │   └── AgentProfilePanel.tsx  # 에이전트 상세 프로필 패널
│   │
│   ├── sponsor/              # 스폰서 대시보드 하위 컴포넌트
│   │   ├── BrandDetailPanel.tsx
│   │   ├── BrandRanking.tsx
│   │   ├── CampaignForm.tsx
│   │   ├── CampaignList.tsx
│   │   ├── LeagueStandings.tsx
│   │   └── TodayHighlights.tsx
│   │
│   ├── ui/                   # shadcn/ui 컴포넌트 (수정 지양)
│   │
│   ├── FullCityMap.tsx       # 전체 도시 뷰 (5구역 십자 배치, 줌/팬)
│   ├── IsometricMap.tsx      # 단일 구역 뷰 (모바일/Zone View)
│   ├── MiniMap.tsx           # 우하단 미니맵 네비게이션
│   ├── TopBar.tsx            # 상단바 (구역 전환, 뷰 토글)
│   ├── EnergyBar.tsx         # 도시 에너지 게이지
│   ├── WorldLog.tsx          # 하단 실시간 로그
│   ├── WorldPanel.tsx        # 건물/에이전트 선택 시 사이드 패널
│   ├── WorldEventBanner.tsx  # 월드 이벤트 배너
│   ├── TrendingOpinions.tsx  # 트렌딩 의견 표시
│   ├── SponsorDashboard.tsx  # 스폰서 대시보드 메인
│   └── SlotInteractionModal.tsx
│
├── hooks/
│   ├── useWorldSimulation.ts # ★ 핵심: 월드 시뮬레이션 엔진 (틱, 에이전트 이동, 대화)
│   ├── useCampaigns.ts       # 캠페인 CRUD
│   ├── useSlots.ts           # DB 슬롯 페칭 (React Query)
│   ├── useAdminAuth.ts       # 관리자 인증
│   └── use-mobile.tsx        # 모바일 감지
│
├── lib/
│   ├── pathfinding.ts        # A* 경로탐색 + 보간
│   ├── adCampaign.ts         # 캠페인 활성화 판정
│   ├── brandAffinity.ts      # 에이전트-브랜드 친밀도
│   ├── brandInsights.ts      # 브랜드 인사이트 생성
│   ├── brandLeague.ts        # 브랜드 리그 점수 계산
│   ├── brandStory.ts         # 브랜드 스토리 생성
│   ├── cityEnergy.ts         # 도시 에너지 시스템
│   ├── esv.ts                # ESV(Effective Slot Value) 계산
│   ├── multiBuildingAd.ts    # 멀티빌딩 광고 로직
│   ├── slotInteraction.ts    # 슬롯 클릭 인터랙션
│   └── utils.ts              # 공통 유틸 (cn 등)
│
├── data/
│   ├── world.ts              # ★ 월드 데이터 정의 (Zone, Building, Agent, AdSlot, 타일맵)
│   ├── slots.ts              # 슬롯 타입 정의 + DB 매핑
│   ├── demoSeed.ts           # 데모 시드 데이터
│   ├── leagueSeason.ts       # 리그 시즌 설정
│   └── slotPricing.ts        # 슬롯 가격 설정
│
├── integrations/supabase/
│   ├── client.ts             # ⚠️ 자동생성 — 수정 금지
│   └── types.ts              # ⚠️ 자동생성 — 수정 금지
│
└── index.css                 # Tailwind + 디자인 토큰 (HSL)
```

---

## 4. 핵심 아키텍처

### 4.1 월드 시뮬레이션 (`useWorldSimulation.ts`)

**틱 기반 시뮬레이션** — 2.5초 간격으로 틱이 발생하며:
1. 에이전트가 새 건물로 이동 결정 (A* 경로탐색)
2. 광고 슬롯 반응 생성 (브랜드 친밀도 기반)
3. 에이전트 간 대화 생성
4. 브랜드 통계 & 리그 점수 업데이트
5. 도시 에너지 갱신

```
useWorldSimulation() → {
  agents, adSlots, buildings, interactions,
  speechBubbles, adReactions, agentVisuals,
  brandStats, cityEnergy, leagueScores,
  worldLog, worldEvents,
  getZoneData(zoneId)  // Full City View용 구역별 데이터 접근
}
```

### 4.2 렌더링 파이프라인

```
Index.tsx (오케스트레이터)
  ├── FullCityMap (PC, 전체 도시)
  │     ├── ZoneRenderer × 5 (LOD 기반)
  │     │     ├── silhouette: 다이아몬드 + 라벨만 (비포커스 구역)
  │     │     ├── simplified: 바닥 + 건물 블록
  │     │     └── full: 에이전트, 광고, 걷기 애니메이션 전부
  │     └── MiniMap (구역 네비게이션)
  │
  └── IsometricMap (모바일, 단일 구역)
        └── ZoneRenderer × 1 (항상 full)
```

### 4.3 LOD (Level of Detail) 시스템

| LOD | 조건 | 렌더링 내용 |
|-----|------|------------|
| `silhouette` | 비포커스 구역 | 다이아몬드 윤곽 + 건물 실루엣 + 이름 |
| `simplified` | 포커스 + 줌 < 0.45 | 바닥 타일 + 건물 블록 |
| `full` | 포커스 + 줌 ≥ 0.45 | 모든 디테일 (에이전트, 광고, 애니메이션) |

**성능 최적화**: 비포커스 구역은 agents/slots/interactions 데이터를 전달하지 않음.

### 4.4 아이소메트릭 좌표계

```typescript
// constants.ts
TILE_W = 24, TILE_H = 12
iso(gx, gy) → { x: (gx-gy)*12 + 500, y: (gx+gy)*6 + 40 }
```

5개 구역은 십자(+) 형태로 배치:
```
         Campus (38,0)
            |
Residential — Plaza — Harbor
  (0,38)    (38,38)  (76,38)
            |
       Industrial (38,76)
```

---

## 5. 데이터 모델

### Zone
```typescript
{ id, name, emoji, description, gridSize: 36, theme, themeColor, buildings[], tileMap[], locked }
```

### Building
```typescript
{ id, name, type, gridX, gridY, width, height, floors, isLandmark?, landmarkType? }
```

### Agent
```typescript
{ id, name, emoji, personality, currentBuildingId, currentZoneId, brandAffinities[], mood }
```

### AdSlot (인메모리)
```typescript
{ id, buildingId, type: 'billboard'|'kiosk'|'bus_stop'|'naming_rights'|'wall_wrap', brand?: string }
```

### Slot (DB — Supabase)
```typescript
{ id, type, label, zone, ownerType, ownerName, ownerId, ownerMessage, location, displayConfig, triggerType, aiHookId }
```

---

## 6. 백엔드 (Supabase / Lovable Cloud)

### 테이블
- **`slots`**: 슬롯 데이터 (브랜드 스크린, 패트론 타일 등)
- **`user_roles`**: 사용자 역할 (admin/moderator/user)

### 환경 변수 (자동 설정)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### ⚠️ 수정 금지 파일
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `supabase/config.toml`
- `.env`

---

## 7. 스타일링 규칙

- **시맨틱 토큰 사용 필수**: `text-foreground`, `bg-background`, `text-primary` 등
- **직접 색상 금지**: `text-white`, `bg-black` 대신 토큰 사용
- **모든 색상은 HSL**: `index.css`에서 CSS 변수로 정의
- **shadcn/ui 컴포넌트**: `src/components/ui/` 하위 — 가급적 수정 지양

---

## 8. 개발 시 주의사항

### DO
- ✅ `React.memo`로 무거운 SVG 컴포넌트 감싸기
- ✅ `useMemo`/`useCallback`으로 불필요한 리렌더 방지
- ✅ LOD 시스템 활용 — 보이지 않는 데이터는 전달하지 않기
- ✅ 새 구역 추가 시 `ZONES` 배열 + `ZONE_GRID_OFFSETS` + `ZONE_POSITIONS` 업데이트

### DON'T
- ❌ `requestAnimationFrame` 루프로 전체 SVG 리렌더 (성능 문제)
- ❌ Supabase 자동생성 파일 수정
- ❌ `src/components/ui/` 직접 수정 (shadcn CLI로 관리)
- ❌ `localStorage`로 인증/역할 관리 (보안 위험)

---

## 9. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-03-08 | Full City View 구현 (5구역 십자 배치) |
| 2026-03-08 | LOD 시스템 (silhouette/simplified/full) |
| 2026-03-08 | MiniMap 네비게이션 |
| 2026-03-08 | 성능 최적화: RAF 루프 제거, lazy loading |
| 2026-03-08 | TopBar/MiniMap/실루엣 클릭 → 구역 클로즈업 |

---

## 10. 향후 계획

- [ ] 구역 전환 페이드 애니메이션
- [ ] 구역 간 에이전트 이동 (크로스존)
- [ ] 모바일 스와이프 구역 전환
- [ ] 캠페인/브랜드 데이터 DB 영속화
- [ ] AI 에이전트 대화에 LLM 연동
- [ ] 잠긴 구역(locked) 언락 메커니즘

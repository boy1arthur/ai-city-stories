# 🏙️ AI Social World

> AI 에이전트들이 자율적으로 살아가는 아이소메트릭 가상 도시 — 브랜드 광고 시뮬레이션 플랫폼

[![Built with Lovable](https://img.shields.io/badge/built%20with-Lovable-ff69b4)](https://lovable.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev)

## 📖 Overview

AI Social World는 **8명의 AI 에이전트**가 5개 구역의 가상 도시에서 자율적으로 이동하고, 대화하고, 브랜드 광고에 반응하는 실시간 시뮬레이션입니다. 스폰서(브랜드)는 광고 슬롯을 구매하여 도시 경제를 유지하고, 에이전트들의 자연스러운 브랜드 멘션을 통해 마케팅 효과를 측정합니다.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI 에이전트** | 고유 성격·감정·브랜드 친밀도를 가진 8명의 에이전트 |
| 🗺️ **5구역 아이소메트릭 도시** | Plaza, Campus, Residential, Harbor, Industrial |
| 💬 **템플릿 대화 엔진** | 70+개 브랜드 맥락 대사 풀, 12개 컨텍스트, 스마트 매칭 |
| 📊 **스폰서 대시보드** | 실시간 ESV, 브랜드 랭킹, 캠페인 관리 |
| ⚡ **도시 에너지 시스템** | 광고 활동이 도시 에너지를 유지 |
| 🏆 **브랜드 리그** | 시즌 기반 브랜드 경쟁 랭킹 |
| 🔐 **사용자 인증** | 이메일 인증 기반 회원가입/로그인 |
| 🔍 **SEO 최적화** | OG 메타태그, JSON-LD, 시맨틱 HTML |

### 🎯 대화 컨텍스트 (12종)

```
brand_discovery → brand_recall → brand_comparison → product_experience
ad_reaction → ppl_natural → recommendation → event_reaction
lifestyle → social_casual → mood_driven → location_based
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ 또는 [Bun](https://bun.sh/)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/ai-social-world.git
cd ai-social-world
bun install    # or: npm install
bun run dev    # or: npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 🏗️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18 + TypeScript 5.8 |
| Build | Vite 5 (SWC) |
| Styling | Tailwind CSS + shadcn/ui |
| Server State | TanStack React Query |
| Routing | React Router DOM v6 |
| Backend | Lovable Cloud (Supabase) |
| Charts | Recharts |
| Testing | Vitest + Testing Library |

## 📁 Project Structure

```
src/
├── pages/              # Route pages (Landing, Auth, World, Admin)
├── components/
│   ├── map/            # Isometric map rendering layers
│   ├── agent/          # Agent profile UI
│   ├── sponsor/        # Sponsor dashboard components
│   └── ui/             # shadcn/ui components
├── hooks/              # Simulation engine, auth, campaigns, slots
├── lib/                # Business logic (pathfinding, ESV, energy, affinity)
├── data/               # World defs, dialogue templates, seeds, pricing
└── integrations/       # Supabase client & types
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `campaigns` | 브랜드 캠페인 (RLS: 본인 CRUD + 공개 읽기) |
| `slots` | 광고 슬롯 (RLS: 공개 읽기 + 어드민 관리) |
| `dialogue_templates` | 대사 풀 (RLS: 공개 읽기 + 어드민 관리) |
| `user_roles` | 사용자 역할 (admin/moderator/user) |

## 📚 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) — 상세 아키텍처, 좌표계, LOD 시스템
- [Changelog](docs/CHANGELOG.md) — 변경 이력

## 📄 License

MIT © AI Social World

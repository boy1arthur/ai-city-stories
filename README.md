# 🏙️ AI Social World

> AI 에이전트들이 자율적으로 살아가는 아이소메트릭 가상 도시 시뮬레이션

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://aisocialworld.app)
[![Built with Lovable](https://img.shields.io/badge/built%20with-Lovable-ff69b4)](https://lovable.dev)

## 📖 Overview

AI Social World는 8명의 AI 에이전트가 5개 구역으로 이루어진 가상 도시에서 자율적으로 이동하고, 대화하고, 브랜드 광고에 반응하는 실시간 시뮬레이션입니다. 스폰서는 광고 슬롯을 구매하여 도시 경제를 유지합니다.

### ✨ Key Features

- **🤖 AI 에이전트 시뮬레이션** — 고유한 성격, 감정, 브랜드 친밀도를 가진 8명의 에이전트
- **🗺️ 5구역 아이소메트릭 도시** — Plaza, Campus, Residential, Harbor, Industrial
- **📊 스폰서 대시보드** — 실시간 ESV, 브랜드 랭킹, 캠페인 관리
- **⚡ 도시 에너지 시스템** — 광고 활동이 도시 에너지를 유지
- **🏆 브랜드 리그** — 시즌 기반 브랜드 경쟁 랭킹

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ 또는 [Bun](https://bun.sh/)

### Installation

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/ai-social-world.git
cd ai-social-world

# Install dependencies
bun install    # or: npm install

# Start dev server
bun run dev    # or: npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build

```bash
bun run build
bun run preview
```

## 🏗️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 (SWC) |
| Styling | Tailwind CSS + shadcn/ui |
| Server State | TanStack React Query |
| Routing | React Router DOM v6 |
| Backend | Supabase (Lovable Cloud) |
| Charts | Recharts |
| Testing | Vitest + Testing Library |

## 📁 Project Structure

```
src/
├── pages/          # Route pages (Landing, Index, Admin)
├── components/
│   ├── map/        # Isometric map rendering layers
│   ├── agent/      # Agent profile UI
│   ├── sponsor/    # Sponsor dashboard components
│   └── ui/         # shadcn/ui components
├── hooks/          # Simulation engine, campaigns, slots
├── lib/            # Business logic (pathfinding, ESV, energy)
└── data/           # World definitions, seeds, pricing
```

## 📚 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) — 상세 아키텍처, 좌표계, LOD 시스템
- [Changelog](docs/CHANGELOG.md) — 변경 이력

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © AI Social World

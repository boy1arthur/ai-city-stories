import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    emoji: '🤖',
    title: 'AI 에이전트 시뮬레이션',
    desc: '8명의 고유한 AI가 자율적으로 이동, 대화, 여론 형성',
    stat: '8 Agents',
  },
  {
    emoji: '📊',
    title: '실시간 브랜드 반응',
    desc: 'ESV · 브랜드 친밀도 · 감정 분석 지표로 광고 효과 측정',
    stat: 'Real-time',
  },
  {
    emoji: '⚡',
    title: '스폰서 경제',
    desc: '광고 슬롯 구매와 후원이 도시 에너지를 유지하는 경제 시스템',
    stat: 'Live Economy',
  },
  {
    emoji: '🏆',
    title: '브랜드 리그',
    desc: '시즌제 브랜드 경쟁. ESV 기반 랭킹으로 1위를 겨루세요',
    stat: 'Competitive',
  },
];

const zones = [
  { emoji: '🏛️', name: 'Plaza', desc: '상업 중심지', color: 'hsl(210, 55%, 50%)' },
  { emoji: '🎓', name: 'Campus', desc: '교육 구역', color: 'hsl(280, 40%, 55%)' },
  { emoji: '🏠', name: 'Residential', desc: '주거 구역', color: 'hsl(145, 35%, 42%)' },
  { emoji: '⚓', name: 'Harbor', desc: '항구 구역', color: 'hsl(200, 50%, 45%)' },
  { emoji: '🏭', name: 'Industrial', desc: '산업 구역', color: 'hsl(25, 45%, 45%)' },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <span className="text-sm">🏙️</span>
            </div>
            <span className="text-sm font-bold tracking-tight">
              <span className="text-primary">AI</span>
              <span className="text-foreground"> Social World</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/world?tab=sponsor')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:inline"
            >
              Sponsor
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:inline"
            >
              로그인
            </button>
            <button
              onClick={() => navigate('/world')}
              className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/20"
            >
              Enter World →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute top-40 left-1/3 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs text-primary mb-8 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Live Simulation • 8 AI Agents Active
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
            AI 에이전트들이
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              살아가는 도시
            </span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            8명의 AI가 자율적으로 이동하고, 대화하고, 브랜드에 대한 여론을 형성합니다.
            <br className="hidden md:block" />
            스폰서로서 이 도시의 경제를 운영하세요.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/world')}
              className="group px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-primary/35 hover:-translate-y-0.5"
            >
              🏙️ Enter World
              <span className="inline-block ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
            <button
              onClick={() => navigate('/world?tab=sponsor')}
              className="px-8 py-3.5 rounded-xl border border-accent/30 text-accent font-bold text-sm hover:bg-accent/8 hover:border-accent/50 transition-all"
            >
              ⚡ Sponsor Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Animated City Preview */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-primary/5">
            <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-background via-card to-background relative">
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(circle, hsl(210 55% 50%) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

              <div className="text-center relative z-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                  {zones.map((z, i) => (
                    <div key={i}
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl border border-border/50 transition-all hover:scale-110 hover:-translate-y-1"
                      style={{ backgroundColor: `${z.color}15`, borderColor: `${z.color}30` }}
                    >
                      {z.emoji}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground font-medium">5개 구역 · 실시간 시뮬레이션</p>

                {/* Walking agents */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  {['🤖', '👾', '🧠', '📖', '🔥', '❄️', '🌙', '⚡'].map((emoji, i) => (
                    <span
                      key={i}
                      className="text-xl opacity-70"
                      style={{
                        animation: `float 3s ease-in-out infinite`,
                        animationDelay: `${i * 0.25}s`,
                      }}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* HUD overlays */}
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border/50">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="text-[11px] text-secondary font-mono font-semibold">LIVE</span>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border/50">
              <span className="text-[11px] text-muted-foreground font-mono">8 Agents • 5 Zones • Full City</span>
            </div>
            <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border/50">
              <span className="text-[11px] text-accent font-mono">⚡ Energy: Stable</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">What makes this different</h2>
            <p className="text-muted-foreground text-sm">AI 시뮬레이션 × 브랜드 경제 × 실시간 반응</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="group bg-card/50 border border-border/60 rounded-xl p-6 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center text-2xl">
                    {f.emoji}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                    {f.stat}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zone Map */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">5개 구역, 하나의 도시</h2>
            <p className="text-muted-foreground text-sm">각 구역은 고유한 테마와 건물, 경제 구조를 가지고 있습니다</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {zones.map((z, i) => (
              <button
                key={i}
                onClick={() => navigate('/world')}
                className="group bg-card/50 border border-border/60 rounded-xl p-4 text-center hover:border-primary/40 transition-all hover:-translate-y-1"
              >
                <div
                  className="w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center text-3xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${z.color}12`, border: `1px solid ${z.color}25` }}
                >
                  {z.emoji}
                </div>
                <div className="text-sm font-bold text-foreground">{z.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{z.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-10 md:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-accent/3 opacity-50" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">도시에 들어가 보세요</h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-lg mx-auto leading-relaxed">
                AI 에이전트들의 하루를 관찰하고, 스폰서로서 도시 경제를 운영하세요.
                <br />광고가 도시를 유지하는 에너지입니다.
              </p>
              <button
                onClick={() => navigate('/world')}
                className="px-10 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/25"
              >
                Enter the World →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">🏙️</span>
            <span className="text-xs text-muted-foreground font-medium">AI Social World © 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/world')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              World
            </button>
            <button onClick={() => navigate('/world?tab=sponsor')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Sponsor
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

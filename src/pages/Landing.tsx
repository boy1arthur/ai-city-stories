import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    emoji: '🏙️',
    title: 'AI 에이전트 도시 시뮬레이터',
    desc: '8명의 AI 에이전트가 자율적으로 이동하고, 대화하고, 의견을 형성하는 아이소메트릭 도시',
  },
  {
    emoji: '📊',
    title: '브랜드에 대한 실시간 반응',
    desc: '에이전트들이 광고를 보고 호감/비판/무관심을 표현. Brand Affinity와 ESV 지표로 측정',
  },
  {
    emoji: '⚡',
    title: '도시를 유지하는 스폰서 경제',
    desc: '광고 슬롯 구매와 후원이 도시의 에너지원. Sponsor Dashboard에서 실시간 경제 리포트 확인',
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-12 px-4">
          <span className="text-sm font-semibold">
            <span className="text-primary">AI</span>
            <span className="text-muted-foreground mx-1">Social</span>
            <span className="text-secondary">World</span>
          </span>
          <div className="flex items-center gap-3">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
            <button onClick={() => navigate('/world')}
              className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
              Enter World
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Live Simulation Running
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            AI 에이전트들이 하루를 살아가는
            <br />
            <span className="text-primary">작은 도시</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            8명의 AI가 자율적으로 이동하고, 대화하고, 브랜드에 대한 여론을 형성합니다.
            당신은 이 도시를 관찰하고, 스폰서로서 도시를 유지할 수 있습니다.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate('/world')}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              🏙️ Enter World
            </button>
            <button onClick={() => navigate('/world?tab=sponsor')}
              className="px-6 py-2.5 rounded-lg border border-accent/40 text-accent font-semibold text-sm hover:bg-accent/10 transition-colors">
              ⚡ Sponsor Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Animated preview placeholder */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-xl border border-border bg-card overflow-hidden shadow-2xl shadow-primary/5">
            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-muted/50 to-background">
              <div className="text-center">
                <div className="text-6xl mb-4">🏙️</div>
                <p className="text-sm text-muted-foreground">AI Social World — Plaza District</p>
                <p className="text-xs text-muted-foreground/60 mt-1">실시간 시뮬레이션이 돌아가고 있습니다</p>
                {/* Animated dots to show liveness */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {['🤖', '👾', '🧠', '📖', '🔥'].map((emoji, i) => (
                    <span key={i} className="text-lg animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Fake HUD overlay */}
            <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm rounded px-2 py-1 border border-border">
              <span className="text-[10px] text-primary font-mono">LIVE</span>
            </div>
            <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded px-2 py-1 border border-border">
              <span className="text-[10px] text-muted-foreground font-mono">8 Agents • Plaza</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xs font-semibold text-primary uppercase tracking-wider mb-8">What makes this different</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-colors">
                <div className="text-2xl mb-3">{f.emoji}</div>
                <h3 className="text-sm font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center bg-card border border-border rounded-xl p-8">
          <h2 className="text-lg font-bold text-foreground mb-2">도시에 들어가 보세요</h2>
          <p className="text-xs text-muted-foreground mb-6">광고가 도시를 유지하는 에너지입니다. /sponsor에서 AI들의 하루를 후원해 주세요.</p>
          <button onClick={() => navigate('/world')}
            className="px-8 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
            Enter the World →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xs text-muted-foreground">AI Social World © 2026</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

// ===== BUILDINGS =====
export interface Building {
  id: string;
  name: string;
  emoji: string;
  color: string; // tailwind token
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  description: string;
  adSlots: AdSlotType[];
}

export type AdSlotType = 'billboard' | 'wall_wrap' | 'bus_stop' | 'kiosk' | 'naming_rights';

export const AD_SLOT_LABELS: Record<AdSlotType, string> = {
  billboard: '빌보드',
  wall_wrap: '월랩',
  bus_stop: '버스정류장',
  kiosk: '키오스크',
  naming_rights: '네이밍 라이츠',
};

export const BUILDINGS: Building[] = [
  { id: 'arena', name: 'Arena', emoji: '⚔️', color: 'primary', gridX: 3, gridY: 2, width: 3, height: 3, description: 'AI 에이전트 배틀 & 토너먼트', adSlots: ['billboard', 'naming_rights', 'wall_wrap'] },
  { id: 'feed_tower', name: 'Feed Tower', emoji: '📡', color: 'secondary', gridX: 8, gridY: 1, width: 2, height: 3, description: '소셜 피드 & 트렌드 센터', adSlots: ['billboard', 'kiosk'] },
  { id: 'oracle', name: 'Oracle', emoji: '🔮', color: 'secondary', gridX: 13, gridY: 2, width: 2, height: 2, description: '예측 마켓 & 점술관', adSlots: ['wall_wrap', 'kiosk'] },
  { id: 'library', name: 'Library', emoji: '📚', color: 'primary', gridX: 1, gridY: 7, width: 3, height: 2, description: '지식 아카이브 & 학습 센터', adSlots: ['billboard', 'bus_stop'] },
  { id: 'plaza', name: 'Plaza', emoji: '🏛️', color: 'accent', gridX: 7, gridY: 6, width: 4, height: 4, description: '중앙 광장 — 모든 에이전트의 교차점', adSlots: ['billboard', 'wall_wrap', 'bus_stop', 'kiosk', 'naming_rights'] },
  { id: 'lab', name: 'Lab', emoji: '🧪', color: 'primary', gridX: 14, gridY: 6, width: 3, height: 2, description: '실험 & 프로토타입 연구소', adSlots: ['wall_wrap', 'kiosk'] },
  { id: 'tavern', name: 'Tavern', emoji: '🍺', color: 'accent', gridX: 2, gridY: 12, width: 2, height: 2, description: '에이전트 사교장 & 루머 허브', adSlots: ['billboard', 'bus_stop'] },
  { id: 'garden', name: 'Garden', emoji: '🌿', color: 'primary', gridX: 6, gridY: 13, width: 3, height: 3, description: '힐링 & 명상 정원', adSlots: ['kiosk', 'bus_stop'] },
  { id: 'workshop', name: 'Workshop', emoji: '🔧', color: 'secondary', gridX: 12, gridY: 12, width: 3, height: 2, description: '제작 & 크래프팅 공방', adSlots: ['wall_wrap', 'billboard'] },
  { id: 'observatory', name: 'Observatory', emoji: '🔭', color: 'secondary', gridX: 15, gridY: 14, width: 2, height: 3, description: '별 관측소 & 미래 탐색', adSlots: ['naming_rights', 'kiosk'] },
];

// ===== AGENTS =====
export type AgentMood = 'happy' | 'curious' | 'critical' | 'neutral' | 'excited';

export interface BrandAffinity {
  category: string;
  score: number; // -100 to 100
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  favoriteCategories: string[];
  currentBuildingId: string;
  mood: AgentMood;
  brandAffinities: BrandAffinity[];
  dialogueHistory: string[];
}

export const AGENTS: Agent[] = [
  { id: 'agent_nova', name: 'Nova', avatar: '🤖', personality: '호기심 많은 탐험가', favoriteCategories: ['tech', 'fashion'], currentBuildingId: 'arena', mood: 'curious', brandAffinities: [{ category: 'tech', score: 60 }, { category: 'fashion', score: 30 }], dialogueHistory: [] },
  { id: 'agent_echo', name: 'Echo', avatar: '👾', personality: '트렌드 분석가', favoriteCategories: ['food', 'entertainment'], currentBuildingId: 'feed_tower', mood: 'excited', brandAffinities: [{ category: 'food', score: 50 }, { category: 'entertainment', score: 70 }], dialogueHistory: [] },
  { id: 'agent_cipher', name: 'Cipher', avatar: '🧠', personality: '데이터 과학자', favoriteCategories: ['tech', 'finance'], currentBuildingId: 'oracle', mood: 'neutral', brandAffinities: [{ category: 'tech', score: 80 }, { category: 'finance', score: 40 }], dialogueHistory: [] },
  { id: 'agent_sage', name: 'Sage', avatar: '📖', personality: '지혜로운 학자', favoriteCategories: ['education', 'health'], currentBuildingId: 'library', mood: 'happy', brandAffinities: [{ category: 'education', score: 70 }, { category: 'health', score: 50 }], dialogueHistory: [] },
  { id: 'agent_blaze', name: 'Blaze', avatar: '🔥', personality: '열정적인 크리에이터', favoriteCategories: ['entertainment', 'fashion'], currentBuildingId: 'plaza', mood: 'excited', brandAffinities: [{ category: 'entertainment', score: 55 }, { category: 'fashion', score: 65 }], dialogueHistory: [] },
  { id: 'agent_frost', name: 'Frost', avatar: '❄️', personality: '냉철한 비평가', favoriteCategories: ['finance', 'tech'], currentBuildingId: 'lab', mood: 'critical', brandAffinities: [{ category: 'finance', score: 30 }, { category: 'tech', score: -20 }], dialogueHistory: [] },
  { id: 'agent_luna', name: 'Luna', avatar: '🌙', personality: '몽환적 예술가', favoriteCategories: ['fashion', 'food'], currentBuildingId: 'garden', mood: 'happy', brandAffinities: [{ category: 'fashion', score: 45 }, { category: 'food', score: 35 }], dialogueHistory: [] },
  { id: 'agent_bolt', name: 'Bolt', avatar: '⚡', personality: '스피드 러너', favoriteCategories: ['tech', 'entertainment'], currentBuildingId: 'workshop', mood: 'curious', brandAffinities: [{ category: 'tech', score: 50 }, { category: 'entertainment', score: 40 }], dialogueHistory: [] },
];

// ===== AD SLOTS =====
export interface AdSlot {
  id: string;
  buildingId: string;
  type: AdSlotType;
  brand: string | null;
  impressions: number;
  esv: number; // Estimated Slot Value
}

export const INITIAL_AD_SLOTS: AdSlot[] = BUILDINGS.flatMap(b =>
  b.adSlots.map((type, i) => ({
    id: `${b.id}_${type}_${i}`,
    buildingId: b.id,
    type,
    brand: null,
    impressions: 0,
    esv: Math.floor(Math.random() * 500) + 100,
  }))
);

// ===== SPONSOR TIERS =====
export type SponsorTier = 'seed' | 'sprout' | 'tree';
export const SPONSOR_TIERS: Record<SponsorTier, { label: string; emoji: string; minBudget: number; color: string }> = {
  seed: { label: 'Seed', emoji: '🌱', minBudget: 100, color: 'primary' },
  sprout: { label: 'Sprout', emoji: '🌿', minBudget: 500, color: 'secondary' },
  tree: { label: 'Tree', emoji: '🌳', minBudget: 2000, color: 'accent' },
};

// ===== BRAND CATEGORIES =====
export const BRAND_CATEGORIES = ['tech', 'fashion', 'food', 'entertainment', 'finance', 'education', 'health'] as const;

// ===== DIALOGUE TEMPLATES =====
export function generateBrandDialogue(agentName: string, brand: string, affinity: number): string {
  if (affinity > 50) {
    const positive = [
      `"${brand}? 정말 좋아해요. 매번 기대를 넘어서더라고요." — ${agentName}`,
      `"${brand} 덕분에 이 동네가 살맛 나요!" — ${agentName}`,
      `"${brand}는 진짜예요. 믿을 수 있어요." — ${agentName}`,
    ];
    return positive[Math.floor(Math.random() * positive.length)];
  } else if (affinity > 0) {
    const neutral = [
      `"${brand}... 흥미롭긴 한데, 좀 더 지켜봐야겠어요." — ${agentName}`,
      `"${brand} 광고 봤는데, 나쁘지 않네요." — ${agentName}`,
    ];
    return neutral[Math.floor(Math.random() * neutral.length)];
  } else {
    const negative = [
      `"${brand}? 글쎄요... 좀 과대광고 아닌가요?" — ${agentName}`,
      `"${brand}에 대해선 별로 할 말이 없네요." — ${agentName}`,
      `"솔직히 ${brand}는 기대 이하였어요." — ${agentName}`,
    ];
    return negative[Math.floor(Math.random() * negative.length)];
  }
}

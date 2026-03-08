// ===== WORLD COORDINATE SYSTEM =====
export interface WorldCoord {
  zoneId: string;
  x: number;
  y: number;
}

// ===== ZONE / DISTRICT =====
export interface Zone {
  id: string;
  name: string;
  emoji: string;
  description: string;
  gridSize: number; // e.g. 18
  theme: 'commercial' | 'campus' | 'residential' | 'industrial' | 'harbor';
  themeColor: string; // CSS hsl
  buildings: Building[];
  tileMap: string[]; // raw tile map rows
  locked: boolean; // future districts start locked
}

// ===== TILE TYPES =====
export type TileType = 'grass' | 'road' | 'sidewalk' | 'plaza_stone' | 'dirt' | 'water' | 'park';

const MAP_KEY: Record<string, TileType> = {
  G: 'grass', R: 'road', S: 'sidewalk', P: 'plaza_stone', K: 'park', D: 'dirt', W: 'water',
};

export function getTileTypeFromMap(tileMap: string[], gx: number, gy: number, gridSize: number): TileType {
  if (gx < 0 || gx >= gridSize || gy < 0 || gy >= gridSize) return 'grass';
  const ch = tileMap[gy]?.[gx];
  if (!ch) return 'grass';
  if ('ALTOKW'.includes(ch)) {
    if (ch === 'K') return 'park';
    if (ch === 'W') return 'water';
    return 'sidewalk';
  }
  return MAP_KEY[ch] || 'grass';
}

export function isRoadCenterInZone(tileMap: string[], gx: number, gy: number, gridSize: number): boolean {
  const t = getTileTypeFromMap(tileMap, gx, gy, gridSize);
  if (t !== 'road') return false;
  if (gx === 7 || gx === 13) return true;
  if (gy === 5 || gy === 10) return true;
  return false;
}

export const TILE_COLORS: Record<TileType, { fill: string; stroke: string; strokeOpacity: number }> = {
  grass:       { fill: 'hsl(140,30%,12%)', stroke: 'hsl(140,25%,16%)', strokeOpacity: 0.3 },
  road:        { fill: 'hsl(220,8%,14%)',  stroke: 'hsl(220,10%,20%)', strokeOpacity: 0.4 },
  sidewalk:    { fill: 'hsl(200,6%,18%)',  stroke: 'hsl(200,8%,24%)',  strokeOpacity: 0.3 },
  plaza_stone: { fill: 'hsl(38,20%,16%)',  stroke: 'hsl(38,30%,24%)',  strokeOpacity: 0.4 },
  park:        { fill: 'hsl(145,35%,14%)', stroke: 'hsl(145,30%,20%)', strokeOpacity: 0.3 },
  dirt:        { fill: 'hsl(30,20%,14%)',  stroke: 'hsl(30,18%,20%)',  strokeOpacity: 0.3 },
  water:       { fill: 'hsl(210,50%,15%)', stroke: 'hsl(210,40%,22%)', strokeOpacity: 0.4 },
};

// ===== BUILDINGS =====
export interface Building {
  id: string;
  name: string;
  emoji: string;
  color: string;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  description: string;
  adSlots: AdSlotType[];
  heightLevel: 1 | 2 | 3;
  roofShape: 'flat' | 'antenna' | 'dish' | 'garden' | 'dome' | 'spire' | 'gear' | 'chimney' | 'lantern' | 'telescope';
  wallColor: string;
  roofColor: string;
}

export type AdSlotType = 'billboard' | 'wall_wrap' | 'bus_stop' | 'kiosk' | 'naming_rights';

export const AD_SLOT_LABELS: Record<AdSlotType, string> = {
  billboard: '빌보드',
  wall_wrap: '월랩',
  bus_stop: '버스정류장',
  kiosk: '키오스크',
  naming_rights: '네이밍 라이츠',
};

// ===== PLAZA DISTRICT (MVP - the main 18x18) =====
const PLAZA_TILE_MAP = [
  'GGGSSSRRSSSSRRSSGG',
  'GGGSSSRRSSSSRRSSGG',
  'GGGSSARRSSSSORRSGG',
  'GGGSSARRSSSSORRSGG',
  'GGGSSARRSSSSORRSGG',
  'RRRRRRRRRRRRRRRRGG',
  'SSSSSSRRPPPPRRSSSG',
  'SLLLSSRRPPPPRRLLSG',
  'SLLLSSRRPPPPRRLLSG',
  'SSSSSSRRPPPPRRSSSG',
  'RRRRRRRRRRRRRRRRGG',
  'GSSSSSRRSSSSRRSSSG',
  'GSTTSGRRSSSGRRKWSG',
  'GSSSSGRRGGGGRRKWSG',
  'GSSSSGRRGGGGRRSSSG',
  'GSSSSGRRGGGGRRTTSG',
  'GSSSSGRRSSSSRRTTSG',
  'GGGGGGRRSSSSRRGGGG',
];

const PLAZA_BUILDINGS: Building[] = [
  { id: 'arena', name: 'Arena', emoji: '⚔️', color: 'primary', gridX: 3, gridY: 2, width: 3, height: 3, description: 'AI 에이전트 배틀 & 토너먼트', adSlots: ['billboard', 'naming_rights', 'wall_wrap'], heightLevel: 3, roofShape: 'dome', wallColor: 'hsl(200,15%,25%)', roofColor: 'hsl(152,40%,20%)' },
  { id: 'feed_tower', name: 'Feed Tower', emoji: '📡', color: 'secondary', gridX: 9, gridY: 1, width: 2, height: 3, description: '소셜 피드 & 트렌드 센터', adSlots: ['billboard', 'kiosk'], heightLevel: 3, roofShape: 'antenna', wallColor: 'hsl(260,15%,22%)', roofColor: 'hsl(270,30%,18%)' },
  { id: 'oracle', name: 'Oracle', emoji: '🔮', color: 'secondary', gridX: 14, gridY: 2, width: 2, height: 2, description: '예측 마켓 & 점술관', adSlots: ['wall_wrap', 'kiosk'], heightLevel: 2, roofShape: 'dish', wallColor: 'hsl(280,12%,24%)', roofColor: 'hsl(270,25%,16%)' },
  { id: 'library', name: 'Library', emoji: '📚', color: 'primary', gridX: 1, gridY: 7, width: 3, height: 2, description: '지식 아카이브 & 학습 센터', adSlots: ['billboard', 'bus_stop'], heightLevel: 2, roofShape: 'spire', wallColor: 'hsl(180,10%,26%)', roofColor: 'hsl(152,25%,18%)' },
  { id: 'plaza', name: 'Plaza', emoji: '🏛️', color: 'accent', gridX: 8, gridY: 6, width: 4, height: 4, description: '중앙 광장 — 모든 에이전트의 교차점', adSlots: ['billboard', 'wall_wrap', 'bus_stop', 'kiosk', 'naming_rights'], heightLevel: 1, roofShape: 'flat', wallColor: 'hsl(38,15%,28%)', roofColor: 'hsl(38,20%,20%)' },
  { id: 'lab', name: 'Lab', emoji: '🧪', color: 'primary', gridX: 14, gridY: 7, width: 2, height: 2, description: '실험 & 프로토타입 연구소', adSlots: ['wall_wrap', 'kiosk'], heightLevel: 2, roofShape: 'antenna', wallColor: 'hsl(170,12%,22%)', roofColor: 'hsl(152,20%,16%)' },
  { id: 'tavern', name: 'Tavern', emoji: '🍺', color: 'accent', gridX: 2, gridY: 12, width: 2, height: 2, description: '에이전트 사교장 & 루머 허브', adSlots: ['billboard', 'bus_stop'], heightLevel: 1, roofShape: 'lantern', wallColor: 'hsl(25,18%,26%)', roofColor: 'hsl(20,22%,18%)' },
  { id: 'garden', name: 'Garden', emoji: '🌿', color: 'primary', gridX: 8, gridY: 13, width: 3, height: 3, description: '힐링 & 명상 정원', adSlots: ['kiosk', 'bus_stop'], heightLevel: 1, roofShape: 'garden', wallColor: 'hsl(140,15%,22%)', roofColor: 'hsl(140,30%,18%)' },
  { id: 'workshop', name: 'Workshop', emoji: '🔧', color: 'secondary', gridX: 14, gridY: 12, width: 2, height: 2, description: '제작 & 크래프팅 공방', adSlots: ['wall_wrap', 'billboard'], heightLevel: 2, roofShape: 'gear', wallColor: 'hsl(240,10%,24%)', roofColor: 'hsl(240,15%,18%)' },
  { id: 'observatory', name: 'Observatory', emoji: '🔭', color: 'secondary', gridX: 14, gridY: 15, width: 2, height: 2, description: '별 관측소 & 미래 탐색', adSlots: ['naming_rights', 'kiosk'], heightLevel: 3, roofShape: 'telescope', wallColor: 'hsl(260,12%,22%)', roofColor: 'hsl(250,20%,16%)' },
];

// ===== CAMPUS DISTRICT (locked preview) =====
const CAMPUS_TILE_MAP = [
  'GGGGGGRRGGGGGGGGGG',
  'GSSSSSRRSSSSSSSSGK',
  'GSSSSSRRSSSSSSSSGK',
  'GSSSSSRRSSSSSSSSGK',
  'RRRRRRRRRRRRRRRRGG',
  'GSSSSGRRSSSSGRRSGK',
  'GSSSSGRRSSSSGRRSGK',
  'GSSSSGRRSSSSGRRSGK',
  'RRRRRRRRRRRRRRRRGG',
  'GSSSSGRRSSSSGRRSGK',
  'GSSSSGRRSSSSGRRSGK',
  'GSSSSGRRSSSSGRRSGK',
  'RRRRRRRRRRRRRRRRGG',
  'GKKKKGRRSSSSGRRSKK',
  'GKKKKGRRSSSSGRRSKK',
  'GKKKKGRRSSSSGRRSKK',
  'GGGGGGRRGGGGGGGGGG',
  'GGGGGGRRGGGGGGGGGG',
];

const CAMPUS_BUILDINGS: Building[] = [
  { id: 'lecture_hall', name: 'Lecture Hall', emoji: '🎓', color: 'primary', gridX: 1, gridY: 1, width: 4, height: 3, description: 'AI 강의 & 워크숍', adSlots: ['billboard', 'naming_rights'], heightLevel: 2, roofShape: 'dome', wallColor: 'hsl(190,12%,24%)', roofColor: 'hsl(152,30%,18%)' },
  { id: 'dorm', name: 'Dormitory', emoji: '🏠', color: 'primary', gridX: 9, gridY: 1, width: 3, height: 3, description: '에이전트 기숙사', adSlots: ['wall_wrap', 'kiosk'], heightLevel: 2, roofShape: 'flat', wallColor: 'hsl(200,10%,26%)', roofColor: 'hsl(200,15%,20%)' },
  { id: 'cafeteria', name: 'Cafeteria', emoji: '🍽️', color: 'accent', gridX: 1, gridY: 5, width: 3, height: 3, description: '학생 식당 & 미팅 포인트', adSlots: ['billboard', 'bus_stop', 'kiosk'], heightLevel: 1, roofShape: 'lantern', wallColor: 'hsl(30,15%,26%)', roofColor: 'hsl(25,20%,18%)' },
  { id: 'research_center', name: 'Research Center', emoji: '🔬', color: 'secondary', gridX: 9, gridY: 5, width: 3, height: 3, description: 'AI 연구 센터', adSlots: ['naming_rights', 'wall_wrap', 'billboard'], heightLevel: 3, roofShape: 'antenna', wallColor: 'hsl(270,12%,22%)', roofColor: 'hsl(270,20%,16%)' },
  { id: 'sports_field', name: 'Sports Field', emoji: '⚽', color: 'primary', gridX: 1, gridY: 9, width: 3, height: 3, description: '운동장 & 이벤트 공간', adSlots: ['billboard', 'bus_stop'], heightLevel: 1, roofShape: 'flat', wallColor: 'hsl(140,12%,22%)', roofColor: 'hsl(140,20%,16%)' },
  { id: 'innovation_lab', name: 'Innovation Lab', emoji: '💡', color: 'secondary', gridX: 9, gridY: 9, width: 3, height: 3, description: '스타트업 인큐베이터', adSlots: ['wall_wrap', 'kiosk', 'naming_rights'], heightLevel: 2, roofShape: 'gear', wallColor: 'hsl(250,10%,24%)', roofColor: 'hsl(250,15%,18%)' },
  { id: 'botanical_garden', name: 'Botanical Garden', emoji: '🌳', color: 'primary', gridX: 1, gridY: 13, width: 4, height: 3, description: '식물원 & 명상 공간', adSlots: ['kiosk', 'bus_stop'], heightLevel: 1, roofShape: 'garden', wallColor: 'hsl(140,18%,20%)', roofColor: 'hsl(145,30%,16%)' },
  { id: 'auditorium', name: 'Auditorium', emoji: '🎭', color: 'accent', gridX: 9, gridY: 13, width: 3, height: 3, description: '공연장 & 컨퍼런스', adSlots: ['naming_rights', 'billboard', 'wall_wrap'], heightLevel: 3, roofShape: 'spire', wallColor: 'hsl(38,12%,26%)', roofColor: 'hsl(38,18%,18%)' },
];

// ===== ALL ZONES =====
export const ZONES: Zone[] = [
  {
    id: 'plaza',
    name: 'Plaza District',
    emoji: '🏛️',
    description: '중심 상업 지구 — 프리미엄 광고 슬롯 집중 구역',
    gridSize: 18,
    theme: 'commercial',
    themeColor: 'hsl(38,92%,50%)',
    buildings: PLAZA_BUILDINGS,
    tileMap: PLAZA_TILE_MAP,
    locked: false,
  },
  {
    id: 'campus',
    name: 'Campus District',
    emoji: '🎓',
    description: '교육 & 연구 지구 — 학습 기반 브랜드 스폰서십',
    gridSize: 18,
    theme: 'campus',
    themeColor: 'hsl(152,76%,44%)',
    buildings: CAMPUS_BUILDINGS,
    tileMap: CAMPUS_TILE_MAP,
    locked: true,
  },
  {
    id: 'harbor',
    name: 'Harbor District',
    emoji: '⚓',
    description: '항구 & 물류 지구 — 글로벌 브랜드 노출 극대화',
    gridSize: 18,
    theme: 'harbor',
    themeColor: 'hsl(210,60%,50%)',
    buildings: [],
    tileMap: [],
    locked: true,
  },
  {
    id: 'industrial',
    name: 'Industrial District',
    emoji: '🏭',
    description: '산업 지구 — 제조/테크 브랜드 특화 구역',
    gridSize: 18,
    theme: 'industrial',
    themeColor: 'hsl(0,0%,50%)',
    buildings: [],
    tileMap: [],
    locked: true,
  },
];

export function getZoneById(zoneId: string): Zone | undefined {
  return ZONES.find(z => z.id === zoneId);
}

// ===== AGENTS =====
export type AgentMood = 'happy' | 'curious' | 'critical' | 'neutral' | 'excited';

export interface BrandAffinity {
  category: string;
  score: number;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  favoriteCategories: string[];
  currentZoneId: string;
  currentBuildingId: string;
  mood: AgentMood;
  brandAffinities: BrandAffinity[];
  dialogueHistory: string[];
}

export const AGENTS: Agent[] = [
  { id: 'agent_nova', name: 'Nova', avatar: '🤖', personality: '호기심 많은 탐험가', favoriteCategories: ['tech', 'fashion'], currentZoneId: 'plaza', currentBuildingId: 'arena', mood: 'curious', brandAffinities: [{ category: 'tech', score: 60 }, { category: 'fashion', score: 30 }], dialogueHistory: [] },
  { id: 'agent_echo', name: 'Echo', avatar: '👾', personality: '트렌드 분석가', favoriteCategories: ['food', 'entertainment'], currentZoneId: 'plaza', currentBuildingId: 'feed_tower', mood: 'excited', brandAffinities: [{ category: 'food', score: 50 }, { category: 'entertainment', score: 70 }], dialogueHistory: [] },
  { id: 'agent_cipher', name: 'Cipher', avatar: '🧠', personality: '데이터 과학자', favoriteCategories: ['tech', 'finance'], currentZoneId: 'plaza', currentBuildingId: 'oracle', mood: 'neutral', brandAffinities: [{ category: 'tech', score: 80 }, { category: 'finance', score: 40 }], dialogueHistory: [] },
  { id: 'agent_sage', name: 'Sage', avatar: '📖', personality: '지혜로운 학자', favoriteCategories: ['education', 'health'], currentZoneId: 'plaza', currentBuildingId: 'library', mood: 'happy', brandAffinities: [{ category: 'education', score: 70 }, { category: 'health', score: 50 }], dialogueHistory: [] },
  { id: 'agent_blaze', name: 'Blaze', avatar: '🔥', personality: '열정적인 크리에이터', favoriteCategories: ['entertainment', 'fashion'], currentZoneId: 'plaza', currentBuildingId: 'plaza', mood: 'excited', brandAffinities: [{ category: 'entertainment', score: 55 }, { category: 'fashion', score: 65 }], dialogueHistory: [] },
  { id: 'agent_frost', name: 'Frost', avatar: '❄️', personality: '냉철한 비평가', favoriteCategories: ['finance', 'tech'], currentZoneId: 'plaza', currentBuildingId: 'lab', mood: 'critical', brandAffinities: [{ category: 'finance', score: 30 }, { category: 'tech', score: -20 }], dialogueHistory: [] },
  { id: 'agent_luna', name: 'Luna', avatar: '🌙', personality: '몽환적 예술가', favoriteCategories: ['fashion', 'food'], currentZoneId: 'plaza', currentBuildingId: 'garden', mood: 'happy', brandAffinities: [{ category: 'fashion', score: 45 }, { category: 'food', score: 35 }], dialogueHistory: [] },
  { id: 'agent_bolt', name: 'Bolt', avatar: '⚡', personality: '스피드 러너', favoriteCategories: ['tech', 'entertainment'], currentZoneId: 'plaza', currentBuildingId: 'workshop', mood: 'curious', brandAffinities: [{ category: 'tech', score: 50 }, { category: 'entertainment', score: 40 }], dialogueHistory: [] },
];

// ===== AD SLOTS =====
export interface AdSlot {
  id: string;
  zoneId: string;
  buildingId: string;
  type: AdSlotType;
  brand: string | null;
  impressions: number;
  esv: number;
  capacity: number; // max brands per slot (usually 1)
  priority: 'premium' | 'standard' | 'basic';
}

function slotPriority(type: AdSlotType): 'premium' | 'standard' | 'basic' {
  if (type === 'naming_rights') return 'premium';
  if (type === 'billboard' || type === 'wall_wrap') return 'standard';
  return 'basic';
}

export function generateAdSlotsForZone(zone: Zone): AdSlot[] {
  return zone.buildings.flatMap(b =>
    b.adSlots.map((type, i) => ({
      id: `${zone.id}_${b.id}_${type}_${i}`,
      zoneId: zone.id,
      buildingId: b.id,
      type,
      brand: null,
      impressions: 0,
      esv: type === 'naming_rights' ? 800 + Math.floor(Math.random() * 400) :
           type === 'billboard' ? 300 + Math.floor(Math.random() * 300) :
           type === 'wall_wrap' ? 250 + Math.floor(Math.random() * 250) :
           100 + Math.floor(Math.random() * 200),
      capacity: 1,
      priority: slotPriority(type),
    }))
  );
}

export const INITIAL_AD_SLOTS: AdSlot[] = ZONES.filter(z => !z.locked).flatMap(generateAdSlotsForZone);

// ===== SPONSOR TIERS =====
export type SponsorTier = 'seed' | 'sprout' | 'tree';
export const SPONSOR_TIERS: Record<SponsorTier, { label: string; emoji: string; minBudget: number; color: string; perks: string[] }> = {
  seed: { label: 'Seed', emoji: '🌱', minBudget: 100, color: 'primary', perks: ['버스정류장 1슬롯', '월간 리포트'] },
  sprout: { label: 'Sprout', emoji: '🌿', minBudget: 500, color: 'secondary', perks: ['빌보드 + 키오스크', '주간 리포트', '에이전트 멘션'] },
  tree: { label: 'Tree', emoji: '🌳', minBudget: 2000, color: 'accent', perks: ['네이밍 라이츠', '월랩', '실시간 대시보드', 'VIP 에이전트 대사'] },
};

export const BRAND_CATEGORIES = ['tech', 'fashion', 'food', 'entertainment', 'finance', 'education', 'health'] as const;

export interface InteractionEvent {
  id: string;
  agentId: string;
  zoneId: string;
  buildingId: string;
  brand: string;
  affinity: number;
  timestamp: number;
}

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

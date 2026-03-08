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
  gridSize: number;
  theme: 'commercial' | 'campus' | 'residential' | 'industrial' | 'harbor';
  themeColor: string;
  buildings: Building[];
  tileMap: string[];
  locked: boolean;
}

// ===== TILE TYPES =====
export type TileType = 'grass' | 'road' | 'sidewalk' | 'plaza_stone' | 'dirt' | 'water' | 'park' | 'parking' | 'field';

const MAP_KEY: Record<string, TileType> = {
  G: 'grass', R: 'road', S: 'sidewalk', P: 'plaza_stone', K: 'park', D: 'dirt', W: 'water', X: 'parking', F: 'field',
};

export function getTileTypeFromMap(tileMap: string[], gx: number, gy: number, gridSize: number): TileType {
  if (gx < 0 || gx >= gridSize || gy < 0 || gy >= gridSize) return 'grass';
  // Map high-res grid (36x36) back to source tile map (18x18)
  const mapX = Math.floor(gx / 2);
  const mapY = Math.floor(gy / 2);
  const ch = tileMap[mapY]?.[mapX];
  if (!ch) return 'grass';
  // Building footprint chars map to sidewalk
  if ('ALTOKBCNEHOVDXM'.includes(ch)) {
    if (ch === 'K') return 'park';
    if (ch === 'W') return 'water';
    return 'sidewalk';
  }
  return MAP_KEY[ch] || 'grass';
}

export function isRoadCenterInZone(tileMap: string[], gx: number, gy: number, gridSize: number): boolean {
  const t = getTileTypeFromMap(tileMap, gx, gy, gridSize);
  if (t !== 'road') return false;
  // Road spines at doubled coords (was 8, now 16-17)
  if (gx === 16 || gx === 17) return true;    // vertical spine (2-tile wide)
  if (gy === 16 || gy === 17) return true;    // horizontal spine (2-tile wide)
  return false;
}

// ===== ZONE-SPECIFIC TILE PALETTES =====
export interface TilePalette {
  grass: { fill: string; stroke: string };
  road: { fill: string; stroke: string };
  sidewalk: { fill: string; stroke: string };
  plaza_stone: { fill: string; stroke: string };
  park: { fill: string; stroke: string };
  dirt: { fill: string; stroke: string };
  water: { fill: string; stroke: string };
  parking: { fill: string; stroke: string };
  field: { fill: string; stroke: string };
}

const PLAZA_PALETTE: TilePalette = {
  grass:       { fill: 'hsl(120,22%,32%)', stroke: 'hsl(120,18%,36%)' },
  road:        { fill: 'hsl(220,6%,28%)',  stroke: 'hsl(220,8%,32%)' },
  sidewalk:    { fill: 'hsl(30,8%,52%)',   stroke: 'hsl(30,10%,56%)' },
  plaza_stone: { fill: 'hsl(35,12%,48%)',  stroke: 'hsl(35,14%,53%)' },
  park:        { fill: 'hsl(130,28%,34%)', stroke: 'hsl(130,24%,38%)' },
  dirt:        { fill: 'hsl(30,18%,34%)',  stroke: 'hsl(30,16%,38%)' },
  water:       { fill: 'hsl(205,40%,38%)', stroke: 'hsl(205,35%,42%)' },
  parking:     { fill: 'hsl(220,5%,34%)',  stroke: 'hsl(220,6%,38%)' },
  field:       { fill: 'hsl(120,20%,36%)', stroke: 'hsl(120,18%,40%)' },
};

const CAMPUS_PALETTE: TilePalette = {
  grass:       { fill: 'hsl(125,26%,36%)', stroke: 'hsl(125,22%,40%)' },
  road:        { fill: 'hsl(220,5%,30%)',  stroke: 'hsl(220,6%,34%)' },
  sidewalk:    { fill: 'hsl(25,12%,54%)',  stroke: 'hsl(25,14%,58%)' },
  plaza_stone: { fill: 'hsl(20,15%,50%)',  stroke: 'hsl(20,18%,55%)' },
  park:        { fill: 'hsl(135,30%,35%)', stroke: 'hsl(135,26%,39%)' },
  dirt:        { fill: 'hsl(25,20%,36%)',  stroke: 'hsl(25,18%,40%)' },
  water:       { fill: 'hsl(200,45%,40%)', stroke: 'hsl(200,40%,44%)' },
  parking:     { fill: 'hsl(220,4%,36%)',  stroke: 'hsl(220,5%,40%)' },
  field:       { fill: 'hsl(100,25%,38%)', stroke: 'hsl(100,22%,42%)' },
};

const HARBOR_PALETTE: TilePalette = {
  grass:       { fill: 'hsl(115,18%,30%)', stroke: 'hsl(115,15%,34%)' },
  road:        { fill: 'hsl(215,5%,30%)',  stroke: 'hsl(215,6%,34%)' },
  sidewalk:    { fill: 'hsl(210,6%,46%)',  stroke: 'hsl(210,8%,50%)' },
  plaza_stone: { fill: 'hsl(210,8%,42%)',  stroke: 'hsl(210,10%,46%)' },
  park:        { fill: 'hsl(130,22%,30%)', stroke: 'hsl(130,18%,34%)' },
  dirt:        { fill: 'hsl(30,12%,32%)',  stroke: 'hsl(30,10%,36%)' },
  water:       { fill: 'hsl(200,50%,35%)', stroke: 'hsl(200,45%,40%)' },
  parking:     { fill: 'hsl(215,4%,34%)',  stroke: 'hsl(215,5%,38%)' },
  field:       { fill: 'hsl(120,15%,32%)', stroke: 'hsl(120,12%,36%)' },
};

const INDUSTRIAL_PALETTE: TilePalette = {
  grass:       { fill: 'hsl(110,14%,28%)', stroke: 'hsl(110,12%,32%)' },
  road:        { fill: 'hsl(220,4%,26%)',  stroke: 'hsl(220,5%,30%)' },
  sidewalk:    { fill: 'hsl(220,5%,40%)',  stroke: 'hsl(220,6%,44%)' },
  plaza_stone: { fill: 'hsl(220,6%,38%)',  stroke: 'hsl(220,7%,42%)' },
  park:        { fill: 'hsl(125,18%,28%)', stroke: 'hsl(125,15%,32%)' },
  dirt:        { fill: 'hsl(30,10%,30%)',  stroke: 'hsl(30,8%,34%)' },
  water:       { fill: 'hsl(200,35%,30%)', stroke: 'hsl(200,30%,34%)' },
  parking:     { fill: 'hsl(220,3%,30%)',  stroke: 'hsl(220,4%,34%)' },
  field:       { fill: 'hsl(110,12%,30%)', stroke: 'hsl(110,10%,34%)' },
};

export const ZONE_PALETTES: Record<string, TilePalette> = {
  plaza: PLAZA_PALETTE,
  campus: CAMPUS_PALETTE,
  harbor: HARBOR_PALETTE,
  industrial: INDUSTRIAL_PALETTE,
};

export function getZonePalette(zoneId: string): TilePalette {
  return ZONE_PALETTES[zoneId] || PLAZA_PALETTE;
}

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
  heightLevel: 1 | 2 | 3 | 4 | 5;
  roofShape: 'flat' | 'antenna' | 'dish' | 'garden' | 'dome' | 'spire' | 'gear' | 'chimney' | 'lantern' | 'telescope' | 'gabled' | 'hip';
  wallColor: string;
  roofColor: string;
  buildingType: 'office' | 'shop' | 'campus' | 'house' | 'warehouse' | 'civic' | 'tower' | 'park_structure';
}

export type AdSlotType = 'billboard' | 'wall_wrap' | 'bus_stop' | 'kiosk' | 'naming_rights';

export const AD_SLOT_LABELS: Record<AdSlotType, string> = {
  billboard: '빌보드',
  wall_wrap: '월랩',
  bus_stop: '버스정류장',
  kiosk: '키오스크',
  naming_rights: '네이밍 라이츠',
};

// ===== PLAZA DISTRICT (dense campus-commercial hybrid) =====
// Legend:  R=road  S=sidewalk  P=plaza_stone  K=park  G=grass
// Building chars: A=Arena E=Feed O=Oracle L=Lab C=Cafe B=Library N=News T=Tavern H=Workshop V=Obs
// Grid: 18x18. Vert road: col 8. Horiz boulevard: row 8.
// All buildings have ≥1 tile buffer from roads (col 7/9 = sidewalk, row 7/9 = sidewalk).
// Each row is exactly 18 chars.
// ===== PLAZA TILE MAP =====
// 18x18 tile map (each cell = 2x2 grid). Road: col 8 (vertical), row 8 (horizontal).
// Buildings packed into tight street-wall blocks for maximum ad wall exposure.
// NW: Arena(A)+Lab(L)+Café(C)  NE: Feed(E)+Oracle(O)+Newsstand(N)+Workshop(H)
// SW: Library(B)+Tavern(T)+Museum(M)  SE: Observatory(V)+Arcade(D)+Garden(K)+TechLab(X)
const PLAZA_TILE_MAP: string[] = [
  'GSSSSSSSRSSSSSSSSG', // 0  border
  'SAAAAAARSEEEEOOOSG', // 1  Arena(1-6) Feed(9-12) Oracle(13-15)
  'SAAAAAARSEEEEOOOSG', // 2
  'SAAAAAARSEEEENNNSG', // 3  Newsstand(13-15) replaces Oracle
  'SAAAAAARSEEEENNNSG', // 4
  'SLLLCCCSRHHHHHHHSG', // 5  Lab(1-3) Café(4-6) Workshop(9-15)
  'SLLLCCCSRHHHHHHHSG', // 6
  'SSSSSSSSRSSSSSSSSS', // 7  sidewalk buffer
  'RRRRRRRRRRRRRRRRRR', // 8  boulevard
  'SBBBTTTSRVVVVDDDSG', // 9  Library(1-3) Tavern(4-6) Obs(9-12) Arcade(13-15)
  'SBBBTTTSRVVVVDDDSG', // 10
  'SBBBTTTSRVVVVDDDSG', // 11
  'SBBBTTTSRKKKXXXXSG', // 12 Garden(9-11) TechLab(12-15)
  'SMMMMMMSRKKKXXXXSG', // 13 Museum(1-6)
  'SMMMMMMSRKKKXXXXSG', // 14
  'SMMMMMMSRSSSSSSSSG', // 15
  'SKKKKKKSRSSSSSSSSG', // 16 Park strip
  'GGGGGGGSRSGGGGGGGG', // 17 border
];

const PLAZA_BUILDINGS: Building[] = [
  // ═══ NW BLOCK — "Premium Tower District" ═══
  // Arena + Lab + Café form L-shaped street wall
  // Arena's E wall + Lab/Café's E walls = continuous vertical ad strip
  // Lab + Café's S walls = continuous horizontal ad strip facing boulevard
  { id: 'arena', name: 'Arena', emoji: '⚔️', color: 'primary',
    gridX: 2, gridY: 2, width: 12, height: 8,
    description: 'AI 에이전트 배틀 & 토너먼트 — 프리미엄 광고 랜드마크',
    adSlots: ['billboard', 'bus_stop'],
    heightLevel: 5, roofShape: 'dome',
    wallColor: 'hsl(215,12%,52%)', roofColor: 'hsl(215,10%,42%)', buildingType: 'civic' },

  { id: 'lab', name: 'Lab', emoji: '🧪', color: 'primary',
    gridX: 2, gridY: 10, width: 6, height: 4,
    description: '실험 & 프로토타입 연구소',
    adSlots: ['kiosk'],
    heightLevel: 2, roofShape: 'flat',
    wallColor: 'hsl(200,8%,50%)', roofColor: 'hsl(200,6%,42%)', buildingType: 'office' },

  { id: 'cafe', name: 'Café', emoji: '☕', color: 'accent',
    gridX: 8, gridY: 10, width: 6, height: 4,
    description: '에이전트 카페 & 미팅 포인트',
    adSlots: ['kiosk'],
    heightLevel: 1, roofShape: 'flat',
    wallColor: 'hsl(30,22%,48%)', roofColor: 'hsl(30,18%,38%)', buildingType: 'shop' },

  // ═══ NE BLOCK — "Media Strip" ═══
  { id: 'feed_tower', name: 'Feed Tower', emoji: '📡', color: 'primary',
    gridX: 18, gridY: 2, width: 8, height: 8,
    description: '소셜 피드 & 트렌드 센터',
    adSlots: ['kiosk'],
    heightLevel: 5, roofShape: 'antenna',
    wallColor: 'hsl(210,10%,48%)', roofColor: 'hsl(210,8%,40%)', buildingType: 'tower' },

  { id: 'oracle', name: 'Oracle', emoji: '🔮', color: 'secondary',
    gridX: 26, gridY: 2, width: 6, height: 4,
    description: '예측 마켓 & 점술관',
    adSlots: ['kiosk'],
    heightLevel: 5, roofShape: 'hip',
    wallColor: 'hsl(25,18%,48%)', roofColor: 'hsl(15,22%,38%)', buildingType: 'shop' },

  { id: 'newsstand', name: 'Newsstand', emoji: '📰', color: 'accent',
    gridX: 26, gridY: 6, width: 6, height: 4,
    description: '뉴스 & 브랜드 캠페인 게시판',
    adSlots: ['kiosk'],
    heightLevel: 2, roofShape: 'flat',
    wallColor: 'hsl(38,20%,45%)', roofColor: 'hsl(38,15%,38%)', buildingType: 'shop' },

  { id: 'workshop', name: 'Workshop', emoji: '🔧', color: 'primary',
    gridX: 18, gridY: 10, width: 8, height: 4,
    description: '제작 & 크래프팅 공방 — 대형 벽면 광고 가능',
    adSlots: ['billboard', 'kiosk'],
    heightLevel: 3, roofShape: 'gear',
    wallColor: 'hsl(30,25%,50%)', roofColor: 'hsl(30,20%,40%)', buildingType: 'warehouse' },

  // ═══ SW BLOCK — "Culture Quarter" ═══
  { id: 'library', name: 'Library', emoji: '📚', color: 'primary',
    gridX: 2, gridY: 18, width: 6, height: 8,
    description: '지식 아카이브 & 학습 센터',
    adSlots: ['billboard', 'bus_stop', 'kiosk'],
    heightLevel: 2, roofShape: 'gabled',
    wallColor: 'hsl(20,20%,52%)', roofColor: 'hsl(10,25%,35%)', buildingType: 'campus' },

  { id: 'tavern', name: 'Tavern', emoji: '🍺', color: 'accent',
    gridX: 8, gridY: 18, width: 6, height: 8,
    description: '에이전트 사교장 & 루머 허브',
    adSlots: ['billboard', 'bus_stop', 'wall_wrap'],
    heightLevel: 2, roofShape: 'gabled',
    wallColor: 'hsl(25,22%,45%)', roofColor: 'hsl(15,28%,32%)', buildingType: 'shop' },

  { id: 'museum', name: 'Museum', emoji: '🏛️', color: 'secondary',
    gridX: 2, gridY: 26, width: 12, height: 6,
    description: '브랜드 역사관 — 대형 벽면 광고 가능',
    adSlots: ['naming_rights', 'wall_wrap', 'billboard'],
    heightLevel: 1, roofShape: 'dome',
    wallColor: 'hsl(30,15%,55%)', roofColor: 'hsl(25,12%,42%)', buildingType: 'civic' },

  // ═══ SE BLOCK — "Innovation Hub" ═══
  { id: 'observatory', name: 'Observatory', emoji: '🔭', color: 'primary',
    gridX: 18, gridY: 18, width: 8, height: 6,
    description: '별 관측소 & 미래 탐색',
    adSlots: ['naming_rights', 'kiosk', 'wall_wrap'],
    heightLevel: 3, roofShape: 'dome',
    wallColor: 'hsl(215,10%,50%)', roofColor: 'hsl(215,8%,40%)', buildingType: 'tower' },

  { id: 'arcade', name: 'Arcade', emoji: '🎮', color: 'accent',
    gridX: 26, gridY: 18, width: 6, height: 6,
    description: '게임 아케이드 & 에이전트 놀이터',
    adSlots: ['wall_wrap', 'kiosk', 'billboard'],
    heightLevel: 3, roofShape: 'flat',
    wallColor: 'hsl(280,15%,48%)', roofColor: 'hsl(280,12%,38%)', buildingType: 'shop' },

  { id: 'garden', name: 'Garden', emoji: '🌿', color: 'secondary',
    gridX: 18, gridY: 24, width: 6, height: 6,
    description: '힐링 & 명상 정원',
    adSlots: ['kiosk', 'bus_stop'],
    heightLevel: 1, roofShape: 'flat',
    wallColor: 'hsl(130,15%,42%)', roofColor: 'hsl(130,20%,35%)', buildingType: 'park_structure' },

  { id: 'tech_lab', name: 'Tech Lab', emoji: '💻', color: 'primary',
    gridX: 26, gridY: 24, width: 4, height: 4,
    description: '테크 허브 & AI 스타트업 인큐베이터',
    adSlots: ['wall_wrap', 'billboard', 'naming_rights'],
    heightLevel: 1, roofShape: 'antenna',
    wallColor: 'hsl(210,8%,48%)', roofColor: 'hsl(210,6%,40%)', buildingType: 'office' },
];

// ===== CAMPUS DISTRICT =====
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
  { id: 'lecture_hall', name: 'Lecture Hall', emoji: '🎓', color: 'primary', gridX: 2, gridY: 2, width: 8, height: 6, description: 'AI 강의 & 워크숍', adSlots: ['billboard', 'naming_rights'], heightLevel: 2, roofShape: 'gabled', wallColor: 'hsl(10,25%,45%)', roofColor: 'hsl(5,20%,35%)', buildingType: 'campus' },
  { id: 'dorm', name: 'Dormitory', emoji: '🏠', color: 'primary', gridX: 18, gridY: 2, width: 6, height: 6, description: '에이전트 기숙사', adSlots: ['wall_wrap', 'kiosk'], heightLevel: 2, roofShape: 'hip', wallColor: 'hsl(25,20%,50%)', roofColor: 'hsl(15,22%,38%)', buildingType: 'house' },
  { id: 'cafeteria', name: 'Cafeteria', emoji: '🍽️', color: 'accent', gridX: 2, gridY: 10, width: 6, height: 6, description: '학생 식당 & 미팅 포인트', adSlots: ['billboard', 'bus_stop', 'kiosk'], heightLevel: 1, roofShape: 'flat', wallColor: 'hsl(30,18%,48%)', roofColor: 'hsl(30,15%,40%)', buildingType: 'shop' },
  { id: 'research_center', name: 'Research Center', emoji: '🔬', color: 'primary', gridX: 18, gridY: 10, width: 6, height: 6, description: 'AI 연구 센터', adSlots: ['naming_rights', 'wall_wrap', 'billboard'], heightLevel: 3, roofShape: 'flat', wallColor: 'hsl(210,10%,50%)', roofColor: 'hsl(210,8%,42%)', buildingType: 'office' },
  { id: 'sports_field', name: 'Sports Field', emoji: '⚽', color: 'secondary', gridX: 2, gridY: 18, width: 6, height: 6, description: '운동장 & 이벤트 공간', adSlots: ['billboard', 'bus_stop'], heightLevel: 1, roofShape: 'flat', wallColor: 'hsl(130,15%,42%)', roofColor: 'hsl(130,12%,36%)', buildingType: 'park_structure' },
  { id: 'innovation_lab', name: 'Innovation Lab', emoji: '💡', color: 'primary', gridX: 18, gridY: 18, width: 6, height: 6, description: '스타트업 인큐베이터', adSlots: ['wall_wrap', 'kiosk', 'naming_rights'], heightLevel: 2, roofShape: 'antenna', wallColor: 'hsl(200,8%,48%)', roofColor: 'hsl(200,6%,40%)', buildingType: 'office' },
  { id: 'botanical_garden', name: 'Botanical Garden', emoji: '🌳', color: 'secondary', gridX: 2, gridY: 26, width: 8, height: 6, description: '식물원 & 명상 공간', adSlots: ['kiosk', 'bus_stop'], heightLevel: 1, roofShape: 'garden', wallColor: 'hsl(135,18%,40%)', roofColor: 'hsl(135,22%,34%)', buildingType: 'park_structure' },
  { id: 'auditorium', name: 'Auditorium', emoji: '🎭', color: 'accent', gridX: 18, gridY: 26, width: 6, height: 6, description: '공연장 & 컨퍼런스', adSlots: ['naming_rights', 'billboard', 'wall_wrap'], heightLevel: 3, roofShape: 'dome', wallColor: 'hsl(25,15%,48%)', roofColor: 'hsl(20,18%,38%)', buildingType: 'civic' },
];

// ===== ALL ZONES =====
export const ZONES: Zone[] = [
  {
    id: 'plaza',
    name: 'Plaza District',
    emoji: '🏛️',
    description: '중심 상업 지구 — 프리미엄 광고 슬롯 집중 구역',
    gridSize: 36,
    theme: 'commercial',
    themeColor: 'hsl(38,75%,50%)',
    buildings: PLAZA_BUILDINGS,
    tileMap: PLAZA_TILE_MAP,
    locked: false,
  },
  {
    id: 'campus',
    name: 'Campus District',
    emoji: '🎓',
    description: '교육 & 연구 지구 — 학습 기반 브랜드 스폰서십',
    gridSize: 36,
    theme: 'campus',
    themeColor: 'hsl(145,35%,42%)',
    buildings: CAMPUS_BUILDINGS,
    tileMap: CAMPUS_TILE_MAP,
    locked: true,
  },
  {
    id: 'harbor',
    name: 'Harbor District',
    emoji: '⚓',
    description: '항구 & 물류 지구 — 글로벌 브랜드 노출 극대화',
    gridSize: 36,
    theme: 'harbor',
    themeColor: 'hsl(205,50%,45%)',
    buildings: [],
    tileMap: [],
    locked: true,
  },
  {
    id: 'industrial',
    name: 'Industrial District',
    emoji: '🏭',
    description: '산업 지구 — 제조/테크 브랜드 특화 구역',
    gridSize: 36,
    theme: 'industrial',
    themeColor: 'hsl(220,5%,45%)',
    buildings: [],
    tileMap: [],
    locked: true,
  },
  {
    id: 'residential',
    name: 'Residential District',
    emoji: '🏘️',
    description: '주거 지구 — 라이프스타일 브랜드 중심 구역',
    gridSize: 36,
    theme: 'residential',
    themeColor: 'hsl(280,30%,45%)',
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
  capacity: number;
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

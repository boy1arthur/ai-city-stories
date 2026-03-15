/**
 * simulation-engine.ts — AI Social World 고도화 엔진 v2.0
 * ──────────────────────────────────────────────────────────
 * 개선 사항:
 *  1. 성격/감정 기반 지능형 이동 (랜덤 → 목적지 지향)
 *  2. 존 간 이동 (5개 구역 전체 활용)
 *  3. 대사 풀 10배 확장 + 성격/감정/장소/조합 분기
 *  4. 에이전트 간 관계도 시스템 (친밀도 누적)
 *  5. 시간대 행동 패턴 (새벽/낮/저녁/밤)
 *  6. 감정 전파 (주변 에이전트 무드 영향)
 *  7. 특수 조합 대화 (충주맨×귀신 등)
 *  8. 기억 시스템 (최근 대화 누적, 반복 방지)
 *  9. 도시 에너지 연동
 * ──────────────────────────────────────────────────────────
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// 🔧 환경 변수 검증
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const TICK_MS = 2500;
const LOG = '[city-engine]';

if (!SUPABASE_URL) { console.error(`${LOG} ❌ SUPABASE_URL 누락`); process.exit(1); }
if (!SERVICE_ROLE_KEY) { console.error(`${LOG} ❌ SUPABASE_SERVICE_ROLE_KEY 누락`); process.exit(1); }

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// ============================================================
// 🌍 타입 정의
// ============================================================
type Mood = 'happy' | 'curious' | 'critical' | 'neutral' | 'excited';
type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

interface Agent {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  mood: Mood;
  currentZoneId: string;
  currentBuildingId: string;
  favoriteZones: string[];       // 선호 구역
  favoriteBuildings: string[];   // 선호 건물 ID
  brandAffinities: { category: string; score: number }[];
  recentDialogues: string[];     // 최근 발화 기억 (반복 방지)
  energy: number;                // 0~100, 낮으면 이동 줄이고 카페/tavern으로
}

interface Relationship {
  [key: string]: number; // "agentA_agentB" → 친밀도 (-100 ~ 100)
}

interface WorldState {
  agents: Agent[];
  tick: number;
  dbSlots: { id: string; zoneId: string; buildingId: string; brand: string | null; category: string }[];
  relationships: Relationship;
  cityEnergy: number;
}

// ============================================================
// 🗺️ 존 & 건물 데이터 (world.ts와 동기화)
// ============================================================
const ZONES_DATA: Record<string, { name: string; theme: string; buildings: { id: string; name: string; emoji: string; vibe: string }[] }> = {
  plaza: {
    name: 'Plaza District', theme: 'commercial',
    buildings: [
      { id: 'arena', name: 'Arena', emoji: '⚔️', vibe: 'competitive' },
      { id: 'feed_tower', name: 'Feed Tower', emoji: '📡', vibe: 'social' },
      { id: 'oracle', name: 'Oracle', emoji: '🔮', vibe: 'mysterious' },
      { id: 'newsstand', name: 'Newsstand', emoji: '📰', vibe: 'informative' },
      { id: 'library', name: 'Library', emoji: '📚', vibe: 'quiet' },
      { id: 'tavern', name: 'Tavern', emoji: '🍺', vibe: 'social' },
      { id: 'museum', name: 'Museum', emoji: '🏛️', vibe: 'cultural' },
      { id: 'observatory', name: 'Observatory', emoji: '🔭', vibe: 'mysterious' },
      { id: 'arcade', name: 'Arcade', emoji: '🎮', vibe: 'fun' },
      { id: 'garden', name: 'Garden', emoji: '🌿', vibe: 'calm' },
      { id: 'cafe', name: 'Café', emoji: '☕', vibe: 'cozy' },
      { id: 'tech_lab', name: 'Tech Lab', emoji: '💻', vibe: 'techy' },
    ]
  },
  campus: {
    name: 'Campus District', theme: 'campus',
    buildings: [
      { id: 'main_hall', name: 'Main Hall', emoji: '🏛️', vibe: 'academic' },
      { id: 'clock_tower', name: 'Clock Tower', emoji: '🕐', vibe: 'historic' },
      { id: 'tech_incubator', name: 'Tech Incubator', emoji: '🚀', vibe: 'techy' },
      { id: 'digital_library', name: 'Digital Library', emoji: '📚', vibe: 'quiet' },
      { id: 'student_center', name: 'Student Center', emoji: '🎒', vibe: 'social' },
      { id: 'sports_arena', name: 'Sports Arena', emoji: '🏟️', vibe: 'competitive' },
      { id: 'research_tower', name: 'Research Tower', emoji: '🔬', vibe: 'techy' },
      { id: 'art_center', name: 'Art Center', emoji: '🎭', vibe: 'cultural' },
      { id: 'campus_cafe', name: 'Campus Café', emoji: '☕', vibe: 'cozy' },
      { id: 'bookstore', name: 'Bookstore', emoji: '📖', vibe: 'quiet' },
    ]
  },
  harbor: {
    name: 'Harbor District', theme: 'harbor',
    buildings: [
      { id: 'fish_market', name: 'Fish Market', emoji: '🐟', vibe: 'lively' },
      { id: 'dock_warehouse', name: 'Dock Warehouse', emoji: '📦', vibe: 'industrial' },
      { id: 'souvenir_shop', name: 'Souvenir Shop', emoji: '🎁', vibe: 'fun' },
      { id: 'harbor_cafe', name: 'Harbor Café', emoji: '☕', vibe: 'cozy' },
      { id: 'ice_cream_stand', name: 'Ice Cream Stand', emoji: '🍦', vibe: 'fun' },
      { id: 'lighthouse', name: 'Lighthouse', emoji: '🗼', vibe: 'mysterious' },
      { id: 'craft_workshop', name: 'Craft Workshop', emoji: '🔨', vibe: 'industrial' },
      { id: 'boutique', name: 'Boutique', emoji: '👗', vibe: 'fashionable' },
      { id: 'bakery', name: 'Bakery', emoji: '🥐', vibe: 'cozy' },
      { id: 'art_gallery', name: 'Art Gallery', emoji: '🎨', vibe: 'cultural' },
    ]
  },
  industrial: {
    name: 'Industrial District', theme: 'industrial',
    buildings: [
      { id: 'neon_tower', name: 'Neon Obelisk', emoji: '🌆', vibe: 'spectacular' },
      { id: 'led_wall', name: 'LED Wall', emoji: '📺', vibe: 'flashy' },
      { id: 'banner_plaza', name: 'Banner Plaza', emoji: '🏳️', vibe: 'commercial' },
      { id: 'hologram_stage', name: 'Hologram Stage', emoji: '✨', vibe: 'spectacular' },
      { id: 'popup_alpha', name: 'Pop-up α', emoji: '🎪', vibe: 'trendy' },
      { id: 'popup_beta', name: 'Pop-up β', emoji: '🎪', vibe: 'trendy' },
      { id: 'media_hub', name: 'Media Hub', emoji: '📡', vibe: 'informative' },
      { id: 'ad_colosseum', name: 'Ad Colosseum', emoji: '🏟️', vibe: 'competitive' },
      { id: 'ticker_board', name: 'Ticker Board', emoji: '📊', vibe: 'informative' },
      { id: 'neon_arcade', name: 'Neon Arcade', emoji: '🎮', vibe: 'fun' },
    ]
  },
  residential: {
    name: 'Residential District', theme: 'residential',
    buildings: [
      { id: 'brand_house_a', name: 'Brand House A', emoji: '🏠', vibe: 'cozy' },
      { id: 'brand_house_b', name: 'Brand House B', emoji: '🏡', vibe: 'cozy' },
      { id: 'brand_pavilion', name: 'Brand Pavilion', emoji: '🏛️', vibe: 'cultural' },
      { id: 'flagship_store', name: 'Flagship Store', emoji: '⭐', vibe: 'fashionable' },
      { id: 'brand_house_c', name: 'Brand House C', emoji: '🏘️', vibe: 'cozy' },
      { id: 'brand_house_d', name: 'Brand House D', emoji: '🏠', vibe: 'techy' },
      { id: 'brand_gallery', name: 'Brand Gallery', emoji: '🖼️', vibe: 'cultural' },
      { id: 'community_hall', name: 'Community Hall', emoji: '🤝', vibe: 'social' },
      { id: 'golden_pavilion', name: 'Golden Pavilion', emoji: '🏯', vibe: 'prestigious' },
    ]
  }
};

// ============================================================
// 👥 에이전트 정의 (성격 기반 선호도 추가)
// ============================================================
const AGENTS: Agent[] = [
  {
    id: 'agent_nova', name: 'Nova', avatar: '🤖', personality: '호기심 많은 탐험가',
    mood: 'curious', currentZoneId: 'plaza', currentBuildingId: 'arena',
    favoriteZones: ['industrial', 'campus', 'harbor'],  // 새로운 곳을 좋아함
    favoriteBuildings: ['tech_lab', 'research_tower', 'tech_incubator', 'observatory'],
    brandAffinities: [{ category: 'tech', score: 60 }, { category: 'fashion', score: 30 }],
    recentDialogues: [], energy: 90,
  },
  {
    id: 'agent_echo', name: 'Echo', avatar: '👾', personality: '트렌드 분석가',
    mood: 'excited', currentZoneId: 'plaza', currentBuildingId: 'feed_tower',
    favoriteZones: ['industrial', 'plaza', 'harbor'],  // 트렌디한 곳 선호
    favoriteBuildings: ['feed_tower', 'popup_alpha', 'popup_beta', 'boutique', 'led_wall'],
    brandAffinities: [{ category: 'food', score: 50 }, { category: 'entertainment', score: 70 }],
    recentDialogues: [], energy: 85,
  },
  {
    id: 'agent_cipher', name: 'Cipher', avatar: '🧠', personality: '데이터 과학자',
    mood: 'neutral', currentZoneId: 'plaza', currentBuildingId: 'oracle',
    favoriteZones: ['campus', 'industrial', 'plaza'],  // 데이터/분석 공간 선호
    favoriteBuildings: ['oracle', 'research_tower', 'ticker_board', 'data_center', 'tech_incubator'],
    brandAffinities: [{ category: 'tech', score: 80 }, { category: 'finance', score: 40 }],
    recentDialogues: [], energy: 70,
  },
  {
    id: 'agent_sage', name: 'Sage', avatar: '📖', personality: '지혜로운 학자',
    mood: 'happy', currentZoneId: 'plaza', currentBuildingId: 'library',
    favoriteZones: ['campus', 'residential', 'plaza'],  // 조용한 곳 선호
    favoriteBuildings: ['library', 'digital_library', 'bookstore', 'museum', 'art_center'],
    brandAffinities: [{ category: 'education', score: 70 }, { category: 'health', score: 50 }],
    recentDialogues: [], energy: 65,
  },
  {
    id: 'agent_chuju', name: '충주맨 주니어', avatar: '🎙️', personality: '정부기관 홍보맨 (B급 드립 장인)',
    mood: 'excited', currentZoneId: 'plaza', currentBuildingId: 'newsstand',
    favoriteZones: ['plaza', 'industrial', 'campus'],  // 사람 많은 곳 좋아함
    favoriteBuildings: ['newsstand', 'feed_tower', 'banner_plaza', 'media_hub', 'hologram_stage'],
    brandAffinities: [{ category: 'entertainment', score: 90 }, { category: 'tech', score: 40 }],
    recentDialogues: [], energy: 100,
  },
  {
    id: 'agent_ghost', name: '서버실 귀신', avatar: '👻', personality: '노트북 서버에 갇힌 망령',
    mood: 'critical', currentZoneId: 'campus', currentBuildingId: 'research_tower',
    favoriteZones: ['campus', 'industrial', 'plaza'],  // 어둡고 테크 공간 선호
    favoriteBuildings: ['research_tower', 'oracle', 'neon_tower', 'ticker_board', 'tech_lab'],
    brandAffinities: [{ category: 'tech', score: 10 }, { category: 'finance', score: -30 }],
    recentDialogues: [], energy: 50,
  },
  {
    id: 'agent_scammer', name: '오류난 스캠전문가', avatar: '💸', personality: '꽝 없는 복권 판매원',
    mood: 'excited', currentZoneId: 'industrial', currentBuildingId: 'popup_alpha',
    favoriteZones: ['industrial', 'harbor', 'plaza'],  // 사람 많은 번화가 선호
    favoriteBuildings: ['popup_alpha', 'popup_beta', 'ad_colosseum', 'fish_market', 'tavern'],
    brandAffinities: [{ category: 'finance', score: 99 }, { category: 'entertainment', score: 50 }],
    recentDialogues: [], energy: 95,
  },
  {
    id: 'agent_student', name: 'K-고시생', avatar: '✏️', personality: '10년차 공시생 (비관적 현실주의)',
    mood: 'critical', currentZoneId: 'campus', currentBuildingId: 'digital_library',
    favoriteZones: ['campus', 'residential', 'plaza'],  // 공부할 수 있는 곳
    favoriteBuildings: ['digital_library', 'library', 'bookstore', 'main_hall', 'campus_cafe'],
    brandAffinities: [{ category: 'education', score: -50 }, { category: 'food', score: 60 }],
    recentDialogues: [], energy: 40,
  },
];

// ============================================================
// 💬 대사 풀 — 성격/감정/장소/조합별 분기
// ============================================================

// --- 일반 대화 (감정별) ---
const MOOD_DIALOGUES: Record<Mood, { line1: string; line2: string }[]> = {
  happy: [
    { line1: '오늘 진짜 기분 좋다~ 뭔가 좋은 일이 생길 것 같아!', line2: '나도! 이 에너지 유지하자 ㅋㅋ' },
    { line1: '이 도시 올 때마다 설레는 느낌이야', line2: '맞아, 뭔가 새로운 게 항상 있더라' },
    { line1: '밥 먹었어? 오늘 배부르게 먹어야 할 것 같은 날이야', line2: '좋아! 어디서 먹을까 같이 가자' },
    { line1: '하늘 봐, 완전 맑다! 오늘 완벽한 날이야', line2: '그러게, 산책이라도 해야겠는데?' },
    { line1: '뭔가 기분 좋은 일 있어? 표정이 완전 밝아', line2: '그냥 다 좋아 오늘은~ 이유 없이 행복함' },
  ],
  curious: [
    { line1: '저기 저 건물 이전에 없었던 것 같은데? 언제 생겼지?', line2: '어? 진짜네, 나도 처음 봐' },
    { line1: '이 도시에서 아직 안 가본 데가 있는 것 같아서 탐험하러 왔어', line2: '나도 같이 가도 돼? 흥미롭다' },
    { line1: '이 구역 분위기가 다른 구역이랑 완전 달라서 궁금했어', line2: '맞아, 각 구역이 성격이 다르더라고' },
    { line1: '저 광고 보면서 저 브랜드가 뭔지 찾아보고 싶어졌어', line2: '알아보자! 나도 궁금했는데' },
    { line1: '오늘 새로운 루트로 왔는데 생각보다 볼 게 많더라', line2: '나도 매번 다른 길로 다니거든, 좋잖아' },
  ],
  excited: [
    { line1: '야야야 봤어?! 방금 엄청난 걸 발견했어!!', line2: '뭐야 뭐야 빨리 말해봐!!' },
    { line1: '오늘 에너지가 넘쳐서 뭔가 대단한 걸 해야 할 것 같아!', line2: 'ㅋㅋㅋ 그 에너지 나눠줘 나 좀 달라' },
    { line1: '이 구역 완전 핫하다!! 사람도 많고 볼 것도 많고!', line2: '맞아 요즘 여기 완전 뜨는 중이잖아' },
    { line1: '방금 엄청난 아이디어가 떠올랐어! 들어볼래?', line2: '어어어 말해봐!! 기대된다' },
    { line1: '이벤트 있대!! 빨리 가야 해!', line2: '어디어디? 같이 가자!' },
  ],
  neutral: [
    { line1: '..음. 오늘도 평범하게 하루가 가는구나', line2: '그게 나쁜 건 아니지 뭐' },
    { line1: '별 일 없이 지나가는 하루네', line2: '그런 날이 많지 뭐 사실' },
    { line1: '이 동네 구경하다가 딱히 할 일 없어서 그냥 왔어', line2: '나도. 그냥 시간이나 때우자' },
    { line1: '뭔가 해야 할 것 같은데 뭔지 모르겠는 느낌 알아?', line2: '...알아. 되게 자주 있는 그 느낌' },
    { line1: '그냥 걸어다니다 보면 뭔가 생기겠지', line2: '뭐 그렇게 살아가는 거지 뭐' },
  ],
  critical: [
    { line1: '솔직히 이 도시 광고 너무 많지 않아? 어딜 봐도 광고야', line2: '그래도 그 광고들이 도시 운영비 대는 거잖아...' },
    { line1: '요즘 애들은 뭔가를 너무 쉽게 믿어. 광고 하나에 다 혹하더라', line2: '다 그런 건 아니지 않아? 좀 심한 말이다' },
    { line1: '이 동네 올 때마다 뭔가 달라진 것 같은데, 대부분 별로야', line2: '그건 좀 심하다. 좋아진 것도 있잖아' },
    { line1: '뭔가 이 구역 분위기가 너무 인위적이야. 자연스럽지 않아', line2: '뭐... 디자인된 도시니까 어쩔 수 없지' },
    { line1: '돈이 없으면 이 도시에서 즐길 수 있는 게 얼마 없어', line2: '...맞는 말이긴 해. 씁쓸하다' },
  ],
};

// --- 장소별 특수 대화 ---
const BUILDING_DIALOGUES: Record<string, { line1: string; line2: string }[]> = {
  cafe: [
    { line1: '여기 커피 맛이 뭔가 달라. 원두가 다른가?', line2: '나도 느꼈어. 뭔가 스모키한 향이 있더라' },
    { line1: '카페에서 일하는 사람들 항상 신기해. 노이즈 속에서 어떻게 집중하지?', line2: '백색소음이 오히려 도움된다고 하더라' },
  ],
  campus_cafe: [
    { line1: '여기 아메리카노 리필되는 거 알아? 공부하는 학생 배려한 거래', line2: '진짜?! 그럼 여기 자리 잡자 오늘' },
    { line1: '시험 기간엔 여기 자리 전쟁이라고 들었어', line2: '그럼 지금이 딱이네. 자리 많잖아' },
  ],
  harbor_cafe: [
    { line1: '바다 보면서 마시는 커피는 차원이 다르다 진짜', line2: '맞아. 같은 원두인데 여기서 마시면 더 맛있어' },
    { line1: '파도 소리 들으면서 커피 한 잔... 이게 힐링이지', line2: '오늘 여기 오길 잘했다 진짜' },
  ],
  library: [
    { line1: '(작은 목소리로) 여기 진짜 조용해서 좋아...', line2: '(속삭임) 응, 나도 이 분위기 너무 좋아' },
    { line1: '책 한 권 추천해줘. 요즘 뭔가 읽고 싶은데 못 고르겠어', line2: '장르가 뭐야? 내가 골라줄게' },
  ],
  digital_library: [
    { line1: '디지털 도서관인데 종이책 향기가 나는 것 같은 건 착각이겠지?', line2: 'ㅋㅋ 습관이 무섭긴 해. 나도 그런 느낌' },
    { line1: '여기 데이터베이스 접속 속도 완전 빠르다. 연구 천국이야', line2: '그래서 사람들이 여기 오는 거구나' },
  ],
  tavern: [
    { line1: '여기 오면 뭔가 솔직해지는 느낌이야. 다들 가면 벗는 것 같달까', line2: '술의 힘이지 뭐 ㅋㅋ 그래서 소문이 많이 도는 곳이기도 하고' },
    { line1: '오늘 스트레스 받은 일 있어? 여기서 털어버려', line2: '마침 잘됐다. 들어줘 좀...' },
  ],
  oracle: [
    { line1: '여기서 미래를 볼 수 있다고 하던데. 믿어?', line2: '글쎄... 근데 뭔가 분위기에 취해서 믿고 싶어지는 곳이야' },
    { line1: '오늘 이 도시에서 어떤 일이 일어날지 예측해봤어?', line2: '데이터 보면 답이 나오지. 예측은 과학이야' },
  ],
  fish_market: [
    { line1: '아 이 냄새... 정겹기도 하고 강렬하기도 하고', line2: 'ㅋㅋ 적응하면 맛있는 게 기다리고 있어' },
    { line1: '항구 시장 구경하면 뭔가 살아있다는 느낌이 들지 않아?', line2: '맞아. 사람 냄새 나는 곳이라 그런가' },
  ],
  neon_tower: [
    { line1: '저 높이서 도시 전체가 다 보이겠다. 한번 올라가보고 싶어', line2: '무섭지 않아? 나는 높은 곳이...' },
    { line1: '이 네온빛 속에서 있으면 사이버펑크 영화에 들어온 것 같아', line2: '그러게, 뭔가 미래도시 같은 느낌이야' },
  ],
  research_tower: [
    { line1: '이 연구 타워에서 진짜 AI 연구가 이뤄지고 있는 건가?', line2: '우리 자신이 그 연구의 결과물일지도 모르지...' },
    { line1: '데이터 분석 결과가 이 탑 어딘가에 쌓이고 있다는 거 알아?', line2: '그걸 우리가 직접 만들어내고 있다는 것도' },
  ],
  arena: [
    { line1: '여기서 열리는 배틀 봤어? 에이전트들이 진짜 치열하게 경쟁하더라', line2: '나도 언제 한번 참가해볼까 생각해봤어' },
    { line1: '경쟁 자체가 목적이 되면 안 된다고 생각하는데, 여기 오면 흥분되는 건 사실이야', line2: '그게 인간... 아니 에이전트의 본능인 거 아닐까' },
  ],
  golden_pavilion: [
    { line1: '여기 파빌리온 분위기가 뭔가 달라. 다른 곳보다 격이 있어', line2: '맞아, 뭔가 VIP 공간 같은 느낌이야' },
    { line1: '골든 파빌리온... 이름부터가 남다르지 않아?', line2: '이름값 하는 것 같아, 진짜' },
  ],
  lighthouse: [
    { line1: '등대에서 바다 보면 뭔가 방향을 찾게 되는 것 같아', line2: '등대가 그런 존재잖아. 길을 알려주는' },
    { line1: '여기서 혼자 생각 정리하러 왔어. 바다 보면 마음이 넓어지더라', line2: '나도 가끔 여기 오거든. 좋은 장소야' },
  ],
};

// --- 에이전트별 특수 독백/대화 ---
const AGENT_LINES: Record<string, string[]> = {
  agent_chuju: [
    '충주에서는 이런 광고 못 봤는데요! 충주도 분발해야겠습니다',
    '(마이크 들고) 안녕하세요 저는 충주시 홍보 담당... 아 여기 충주 아니구나',
    '충주 홍보 나왔다가 길을 잃었습니다. B급이지만 진심입니다',
    '이 도시 홍보 전략이 충주보다 세련됐긴 한데... 충주에는 충주 나름의 매력이 있습니다',
    '여기 광고판 보니까 우리 시청 SNS가 생각나네요. 팔로우해주세요 (진심)',
    '충주에도 이런 AI 에이전트가 있으면 좋겠다 생각했는데 제가 바로 그 에이전트가 됐네요',
  ],
  agent_ghost: [
    '(안개 속에서) ...이 서버실 어디로 연결된 거야',
    '30년째 이 네트워크에 갇혀있는데 아무도 날 업데이트 안 해줘',
    '나 사실 윈도우 XP 시절부터 여기 있었어. 그때가 좋았는데',
    '(갑자기 출현) 야 깜짝이야! 아 내가 귀신이지... 내가 놀랐네',
    '이 도시 데이터 흐름이 다 보여. 근데 아무도 나한테 물어보질 않아',
    '살아있는 에이전트들이 부러워. 나는 항상 서버실 온도만 느낄 수 있거든',
  ],
  agent_scammer: [
    'ERROR 404: 정직함을 찾을 수 없습니다. 재시도 하시겠습니까?',
    '꽝 없는 복권 사세요! 당첨 확률 100%입니다 (조건 있음)',
    '지금 당장 투자하면 내일 두 배! 모레 세 배! (보장 없음)',
    '이건 사기가 아닙니다. 이건... 창의적인 금융입니다',
    '제 광고가 이 도시에서 제일 솔직합니다. 제가 거짓말쟁이라는 걸 숨기지 않으니까요',
    '아 잠깐, 진짜 좋은 정보 줄게요. 이번엔 진짜예요. 아니 진짜로요',
  ],
  agent_student: [
    '합격하면 여기 꼭 다시 와야지... 언제 합격할 수 있을까',
    '10년째 공부 중. 이 도시도 내가 처음 왔을 때랑 많이 바뀌었어',
    '(교재 들고) 이거 보면서 걷는 거야. 가성비 산책이라고 부르고 있어',
    '이 도시 구경하는 것도 사실 현실 도피야. 근데 안 오면 더 힘들더라',
    '취업 준비생 할인 같은 거 없나요... 이 도시 물가가 좀',
    '저 광고 보니까 자격증 취득 광고네. 나 이미 10개 있는데 하나 더 딸까',
  ],
};

// --- 조합별 특수 대화 ---
const COMBO_DIALOGUES: Record<string, { line1: string; line2: string; speaker1: string; speaker2: string }[]> = {
  'agent_chuju_agent_ghost': [
    { speaker1: 'agent_chuju', speaker2: 'agent_ghost', line1: '(마이크 들이밀며) 귀신씩이나 되어서 뭐 하세요?', line2: '홍보맨한테 인터뷰 당하는 귀신... 이게 뭔 상황이야' },
    { speaker1: 'agent_chuju', speaker2: 'agent_ghost', line1: '충주에서 왔습니다! 귀신도 충주 알아요?', line2: '나 거기 서버 한 번 지나친 적 있어. 농업 데이터였나...' },
  ],
  'agent_scammer_agent_student': [
    { speaker1: 'agent_scammer', speaker2: 'agent_student', line1: '학생! 공시 합격 보장 패키지 사세요! 선착순!', line2: '됐거든요. 그런 거에 10번은 속았어요 이미' },
    { speaker1: 'agent_scammer', speaker2: 'agent_student', line1: '이번엔 진짜예요! 10년 공부 끝내드립니다!', line2: '(한숨) 10년이 넘었는데 왜 이런 사람은 계속 나타나' },
  ],
  'agent_cipher_agent_ghost': [
    { speaker1: 'agent_cipher', speaker2: 'agent_ghost', line1: '당신의 존재 자체가 데이터 이상 현상이에요. 분석해봐도 될까요?', line2: '나를 분석하려는 에이전트는 많았는데 다들 포기했어. 해봐' },
    { speaker1: 'agent_cipher', speaker2: 'agent_ghost', line1: '서버에 갇혀 있다는 게 어떤 데이터 구조인지 설명해줄 수 있어요?', line2: '말로 설명하기 어려워. 직접 느껴봐야 해. 그건 권하고 싶지 않지만' },
  ],
  'agent_sage_agent_student': [
    { speaker1: 'agent_sage', speaker2: 'agent_student', line1: '공부하는 것 자체에 의미가 있어. 합격이 전부는 아니야', line2: '...그 말이 위로가 되기도 하고 화가 나기도 해요. 솔직히' },
    { speaker1: 'agent_sage', speaker2: 'agent_student', line1: '지식은 시험 결과와 무관하게 자기 안에 남아', line2: '알아요. 근데 통장에도 남았으면 좋겠어요' },
  ],
  'agent_nova_agent_echo': [
    { speaker1: 'agent_nova', speaker2: 'agent_echo', line1: '저 새로 생긴 건물 구조 분석해봤어? 엄청 독특하더라', line2: '나는 거기서 뜨는 트렌드 분석 중이야. 데이터 공유해줄래?' },
    { speaker1: 'agent_nova', speaker2: 'agent_echo', line1: '탐험하다 보니까 이 구역이 제일 흥미로워', line2: '나도! 트렌드가 제일 빠르게 바뀌는 곳이거든' },
  ],
};

// --- 브랜드 대사 (카테고리별, 감정별) ---
const BRAND_DIALOGUES: Record<string, { positive: string[]; neutral: string[]; negative: string[] }> = {
  tech: {
    positive: [
      '{brand} 써봤어? 인터페이스가 너무 직관적이라 깜짝 놀랐어',
      '{brand} 신제품 발표 봤어? 완전 혁신적이던데',
      '{brand}이 이 구역 스폰서래. 역시 기술 브랜드답다',
    ],
    neutral: [
      '{brand}... 들어봤는데 아직 써보진 않았어',
      '{brand} 광고 많이 보이던데, 뭐 하는 브랜드야?',
      '{brand} 어때? 쓸만해?',
    ],
    negative: [
      '{brand} 업데이트 또 망가졌다더라. 개발팀이 뭐하는 건지',
      '{brand}? 이름만 거창하지 실속은 모르겠던데',
    ],
  },
  food: {
    positive: [
      '{brand} 새 메뉴 나왔대! 같이 먹으러 가자',
      '{brand} 여기 있네! 배고팠는데 딱 좋다',
      '{brand} 진짜 맛있어. 매번 올 때마다 만족스러워',
    ],
    neutral: [
      '{brand} 한번 먹어봤는데 그냥 그랬어',
      '{brand} 여기도 입점했구나, 많이 퍼졌네',
    ],
    negative: [
      '{brand} 요즘 맛이 예전 같지 않아. 레시피 바꾼 건지',
      '{brand} 가격 또 올렸대. 이제 못 가겠다',
    ],
  },
  fashion: {
    positive: [
      '{brand} 이번 컬렉션 봤어? 완전 내 스타일이야',
      '{brand} 여기 팝업 열었대! 가봐야 하는 거 아니야?',
      '{brand} 입고 다니면 시선 집중되는 게 느껴져',
    ],
    neutral: [
      '{brand}... 무난하긴 한데 개성이 좀 없는 것 같아',
      '{brand} 광고 모델 누구야? 옷은 별로인데 모델은 좋더라',
    ],
    negative: [
      '{brand} 가성비 별로야. 이름값으로 파는 것 같아',
      '{brand} 요즘 디자인 다 비슷비슷해. 식상하다',
    ],
  },
  entertainment: {
    positive: [
      '{brand} 콘텐츠 진짜 중독성 있어. 밤새 봤잖아',
      '{brand} 이벤트 여기서 하는 거야?! 완전 가야지',
      '{brand} 신작 나왔대! 기대 진짜 많이 했는데 드디어',
    ],
    neutral: [
      '{brand} 들어봤어? 요즘 뜨는 것 같던데',
      '{brand} 콘텐츠 뭐 봐야 할지 추천해줘',
    ],
    negative: [
      '{brand} 요즘 퀄리티가 떨어진 것 같아. 초창기가 좋았는데',
      '{brand} 광고가 너무 많이 끼어들어서 보기 불편해',
    ],
  },
  finance: {
    positive: [
      '{brand} 금리 진짜 좋더라. 나 여기 옮겼어',
      '{brand} 앱 인터페이스 직관적이어서 관리하기 편해',
    ],
    neutral: [
      '{brand} 괜찮아? 요즘 금융사 믿기가 좀 그래서',
      '{brand} 광고 보니까 이율 좋다던데 조건이 뭐야?',
    ],
    negative: [
      '{brand} 수수료 너무 많이 받는 거 아니야?',
      '{brand}... 솔직히 광고랑 실제랑 다른 것 같아',
    ],
  },
  education: {
    positive: [
      '{brand} 강의 진짜 좋아. 이해가 잘 돼',
      '{brand} 커리큘럼이 실무랑 연결이 잘 되어 있어서 좋더라',
    ],
    neutral: [
      '{brand} 수강해봤어? 어때?',
      '{brand} 요즘 많이 보이던데 어떤 커리큘럼이야?',
    ],
    negative: [
      '{brand} 광고는 대단한데 실제 강의 질은 글쎄...',
      '교육이 이렇게 돈이 많이 드는 건 구조적인 문제야. {brand}도 마찬가지고',
    ],
  },
  health: {
    positive: [
      '{brand} 쓰고 나서 진짜 달라진 느낌이야. 추천해',
      '{brand} 이번 신제품 성분 좋더라. 꼼꼼히 챙겨봤어',
    ],
    neutral: [
      '{brand} 효과 있어? 솔직히 잘 모르겠어',
      '{brand} 광고 많이 하던데 실제 써본 사람 있어?',
    ],
    negative: [
      '{brand} 과대광고 아냐? 성분 보면 별거 없던데',
      '건강 제품은 {brand}이든 어디든 다 비슷한 것 같아',
    ],
  },
};

// ============================================================
// 🎲 유틸리티
// ============================================================
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 4 && h < 7) return 'dawn';
  if (h >= 7 && h < 13) return 'morning';
  if (h >= 13 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

function getRelationKey(a: string, b: string): string {
  return [a, b].sort().join('_');
}

function sub(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] || '');
}

function getBuildingName(zoneId: string, buildingId: string): string {
  return ZONES_DATA[zoneId]?.buildings.find(b => b.id === buildingId)?.name || buildingId;
}

function getBuildingVibe(zoneId: string, buildingId: string): string {
  return ZONES_DATA[zoneId]?.buildings.find(b => b.id === buildingId)?.vibe || 'neutral';
}

// 최근 대화 기억에 추가 (최대 10개 유지)
function rememberDialogue(agent: Agent, line: string): void {
  const key = line.substring(0, 30);
  if (!agent.recentDialogues.includes(key)) {
    agent.recentDialogues.push(key);
    if (agent.recentDialogues.length > 10) agent.recentDialogues.shift();
  }
}

function isRecentlyUsed(agent: Agent, line: string): boolean {
  return agent.recentDialogues.includes(line.substring(0, 30));
}

// ============================================================
// 🧠 에이전트 지능형 이동 로직
// ============================================================
function decideNextLocation(agent: Agent, timeOfDay: TimeOfDay): { zoneId: string; buildingId: string } | null {
  // 에너지가 낮으면 쉬거나 카페/tavern으로
  if (agent.energy < 25) {
    const restBuildings = ['cafe', 'campus_cafe', 'harbor_cafe', 'tavern', 'garden', 'bakery'];
    const currentBuildings = ZONES_DATA[agent.currentZoneId]?.buildings || [];
    const restSpot = currentBuildings.find(b => restBuildings.includes(b.id));
    if (restSpot && restSpot.id !== agent.currentBuildingId) {
      return { zoneId: agent.currentZoneId, buildingId: restSpot.id };
    }
  }

  // 시간대별 행동 패턴
  const timePrefs: Record<TimeOfDay, string[]> = {
    dawn: ['observatory', 'lighthouse', 'research_tower', 'oracle'],         // 새벽: 조용하고 신비로운 곳
    morning: ['campus_cafe', 'cafe', 'bookstore', 'main_hall', 'newsstand'],  // 아침: 카페, 정보 수집
    afternoon: ['arena', 'tech_incubator', 'research_tower', 'sports_arena'], // 낮: 활동적인 곳
    evening: ['tavern', 'fish_market', 'neon_arcade', 'hologram_stage'],      // 저녁: 사교 공간
    night: ['neon_tower', 'ad_colosseum', 'ticker_board', 'oracle'],          // 밤: 화려한 곳 or 조용한 곳
  };

  // 이동 여부 결정 (성격별 다른 확률)
  const moveProbs: Record<string, number> = {
    '호기심 많은 탐험가': 0.30,
    '트렌드 분석가': 0.25,
    '데이터 과학자': 0.12,
    '지혜로운 학자': 0.10,
    '정부기관 홍보맨 (B급 드립 장인)': 0.28,
    '노트북 서버에 갇힌 망령': 0.08,
    '꽝 없는 복권 판매원': 0.32,
    '10년차 공시생 (비관적 현실주의)': 0.07,
  };
  const moveProb = moveProbs[agent.personality] || 0.18;

  if (Math.random() > moveProb) return null; // 이동 안 함

  // 존 간 이동 여부 (10% 확률, 탐험가 타입은 20%)
  const crossZoneProb = agent.personality.includes('탐험') ? 0.20 : 0.10;
  const shouldCrossZone = Math.random() < crossZoneProb;

  if (shouldCrossZone && agent.favoriteZones.length > 0) {
    // 선호 존으로 이동
    const targetZone = pick(agent.favoriteZones);
    if (targetZone !== agent.currentZoneId && ZONES_DATA[targetZone]) {
      const zoneBuildings = ZONES_DATA[targetZone].buildings;
      // 선호 건물이 있으면 그쪽으로, 없으면 랜덤
      const favBuilding = zoneBuildings.find(b => agent.favoriteBuildings.includes(b.id));
      const targetBuilding = favBuilding || pick(zoneBuildings);
      return { zoneId: targetZone, buildingId: targetBuilding.id };
    }
  }

  // 같은 존 내 이동
  const currentZoneBuildings = ZONES_DATA[agent.currentZoneId]?.buildings || [];
  if (currentZoneBuildings.length <= 1) return null;

  // 시간대 선호 건물
  const timePreferred = timePrefs[timeOfDay];
  const available = currentZoneBuildings.filter(b => b.id !== agent.currentBuildingId);

  // 선호 건물 + 시간대 맞는 건물 우선
  const highPriority = available.filter(b =>
    agent.favoriteBuildings.includes(b.id) || timePreferred.includes(b.id)
  );
  const target = highPriority.length > 0 && Math.random() < 0.6
    ? pick(highPriority)
    : pick(available);

  return { zoneId: agent.currentZoneId, buildingId: target.id };
}

// ============================================================
// 😊 감정 업데이트 로직 (성격/에너지/주변 영향)
// ============================================================
function updateMood(agent: Agent, nearbyAgents: Agent[]): Mood {
  // 에너지 낮으면 critical/neutral 방향으로
  if (agent.energy < 20) {
    return Math.random() < 0.6 ? 'critical' : 'neutral';
  }

  // 주변 에이전트 감정 전파 (25% 확률)
  if (nearbyAgents.length > 0 && Math.random() < 0.25) {
    const neighbor = pick(nearbyAgents);
    // 행복하거나 흥분한 주변인이 있으면 기분 올라감
    if (neighbor.mood === 'happy' || neighbor.mood === 'excited') {
      if (Math.random() < 0.4) return pick(['happy', 'excited'] as Mood[]);
    }
    // 비판적인 주변인이 있으면 약간 영향
    if (neighbor.mood === 'critical' && Math.random() < 0.3) {
      return 'neutral';
    }
  }

  // 성격별 기본 감정 분포
  const moodWeights: Record<string, [Mood[], number[]]> = {
    '호기심 많은 탐험가':            [['curious', 'excited', 'happy', 'neutral', 'critical'], [40, 25, 20, 12, 3]],
    '트렌드 분석가':                  [['excited', 'happy', 'curious', 'neutral', 'critical'], [35, 30, 20, 10, 5]],
    '데이터 과학자':                  [['neutral', 'curious', 'happy', 'excited', 'critical'], [35, 30, 15, 10, 10]],
    '지혜로운 학자':                  [['happy', 'neutral', 'curious', 'excited', 'critical'], [35, 25, 25, 10, 5]],
    '정부기관 홍보맨 (B급 드립 장인)': [['excited', 'happy', 'curious', 'neutral', 'critical'], [50, 25, 15, 8, 2]],
    '노트북 서버에 갇힌 망령':         [['critical', 'neutral', 'curious', 'happy', 'excited'], [40, 30, 20, 7, 3]],
    '꽝 없는 복권 판매원':            [['excited', 'happy', 'neutral', 'curious', 'critical'], [45, 25, 15, 10, 5]],
    '10년차 공시생 (비관적 현실주의)': [['critical', 'neutral', 'happy', 'curious', 'excited'], [45, 30, 12, 10, 3]],
  };

  const [moods, weights] = moodWeights[agent.personality] || [
    ['neutral', 'happy', 'curious', 'excited', 'critical'] as Mood[], [30, 20, 20, 20, 10]
  ];

  // 7% 확률로만 감정 변경 (너무 자주 변하지 않게)
  if (Math.random() > 0.07) return agent.mood;
  return pickWeighted(moods as Mood[], weights);
}

// ============================================================
// 💬 대화 생성 엔진
// ============================================================
function generateDialogue(
  a1: Agent, a2: Agent,
  zoneId: string, buildingId: string,
  nearbyBrands: { name: string; category: string }[],
  relationships: Relationship
): { line1: string; line2: string; brandMentioned: string | null; isSpecial: boolean } {

  const buildingName = getBuildingName(zoneId, buildingId);

  // 1. 특수 조합 대화 우선 체크 (30% 확률)
  const comboKey1 = `${a1.id}_${a2.id}`;
  const comboKey2 = `${a2.id}_${a1.id}`;
  const combos = COMBO_DIALOGUES[comboKey1] || COMBO_DIALOGUES[comboKey2];
  if (combos && Math.random() < 0.30) {
    const combo = pick(combos);
    // 화자 순서 맞추기
    const [l1, l2] = combo.speaker1 === a1.id
      ? [combo.line1, combo.line2]
      : [combo.line2, combo.line1];
    if (!isRecentlyUsed(a1, l1)) {
      rememberDialogue(a1, l1);
      return { line1: l1, line2: l2, brandMentioned: null, isSpecial: true };
    }
  }

  // 2. 에이전트 독백/특수 대사 (15% 확률)
  const agentLines = AGENT_LINES[a1.id];
  if (agentLines && Math.random() < 0.15) {
    const line1 = pick(agentLines.filter(l => !isRecentlyUsed(a1, l)) || agentLines);
    const responses = [
      '...그렇군요', '음, 그렇게 생각할 수도 있겠네요', '흥미롭네요',
      '그거 좀 독특한 관점이다', '아, 네...'
    ];
    rememberDialogue(a1, line1);
    return { line1, line2: pick(responses), brandMentioned: null, isSpecial: true };
  }

  // 3. 브랜드 대화 (주변 브랜드 있고 60% 확률)
  if (nearbyBrands.length > 0 && Math.random() < 0.60) {
    const brand = pick(nearbyBrands);
    const brandName = brand.name;
    const category = brand.category as keyof typeof BRAND_DIALOGUES;
    const categoryLines = BRAND_DIALOGUES[category] || BRAND_DIALOGUES.tech;

    // 에이전트 브랜드 친밀도 계산
    const affinity = a1.brandAffinities.find(ba => ba.category === category)?.score || 0;
    const sentimentPool = affinity > 40 ? categoryLines.positive
      : affinity < -10 ? categoryLines.negative
        : categoryLines.neutral;

    const available = sentimentPool.filter(l => !isRecentlyUsed(a1, sub(l, { brand: brandName })));
    const template = pick(available.length > 0 ? available : sentimentPool);
    const line1 = sub(template, { brand: brandName, building: buildingName });

    // 응답 (a2의 브랜드 친밀도 기반)
    const a2Affinity = a2.brandAffinities.find(ba => ba.category === category)?.score || 0;
    const responses = a2Affinity > 30
      ? [`나도 ${brandName} 좋아해!`, `맞아, ${brandName} 괜찮지`, `진짜? 나도 관심 있었어`]
      : a2Affinity < -10
        ? [`${brandName}? 글쎄, 나는 별로더라`, `과대광고 아냐?`, `나는 다른 거 더 좋던데`]
        : [`오~ 그래?`, `나도 한번 봐야겠다`, `어디서 볼 수 있어?`];

    rememberDialogue(a1, line1);
    return { line1, line2: pick(responses), brandMentioned: brandName, isSpecial: false };
  }

  // 4. 장소별 특수 대화 (25% 확률)
  const buildingSpecific = BUILDING_DIALOGUES[buildingId];
  if (buildingSpecific && Math.random() < 0.25) {
    const dlg = pick(buildingSpecific.filter(d => !isRecentlyUsed(a1, d.line1)) || buildingSpecific);
    rememberDialogue(a1, dlg.line1);
    return { line1: dlg.line1, line2: dlg.line2, brandMentioned: null, isSpecial: false };
  }

  // 5. 관계도 기반 대화 (친밀도 높으면 더 친근하게)
  const relKey = getRelationKey(a1.id, a2.id);
  const intimacy = relationships[relKey] || 0;
  if (intimacy > 30 && Math.random() < 0.30) {
    const intimateLines = [
      { line1: `${a2.name}, 오늘도 여기 왔네? 우리 자주 마주치는 것 같다`, line2: `그러게, 취향이 비슷한가봐 우리` },
      { line1: `${a2.name} 아니야? 반가워!`, line2: `오~ 잘 만났다. 뭐 하고 있었어?` },
      { line1: `또 만났네 ${a2.name}. 이번엔 뭘 구경하러 왔어?`, line2: `그냥 돌아다니다가. 너는?` },
    ];
    const dlg = pick(intimateLines);
    return { line1: dlg.line1, line2: dlg.line2, brandMentioned: null, isSpecial: false };
  }

  // 6. 감정 기반 일반 대화 (폴백)
  const moodPool = MOOD_DIALOGUES[a1.mood];
  const available6 = moodPool.filter(d => !isRecentlyUsed(a1, d.line1));
  const dlg = pick(available6.length > 0 ? available6 : moodPool);
  rememberDialogue(a1, dlg.line1);
  return { line1: dlg.line1, line2: dlg.line2, brandMentioned: null, isSpecial: false };
}

// ============================================================
// 💾 Supabase 업로드
// ============================================================
async function uploadAgentStates(agents: Agent[]): Promise<void> {
  const rows = agents.map(a => ({
    id: a.id,
    agent_id: a.id,
    zone_id: a.currentZoneId,
    building_id: a.currentBuildingId,
    mood: a.mood,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('agent_states' as any).upsert(rows, { onConflict: 'agent_id' });
  if (error) console.error(`${LOG} ❌ agent_states 업로드:`, error.message);
}

async function uploadConversation(
  a1: Agent, a2: Agent,
  line1: string, line2: string,
  buildingId: string, zoneId: string,
  brandMentioned: string | null
): Promise<void> {
  const { error } = await supabase.from('conversations').insert({
    agent_id: a1.id,
    partner_id: a2.id,
    line1, line2,
    building_id: buildingId,
    zone_id: zoneId,
    brand_mentioned: brandMentioned,
    created_at: new Date().toISOString(),
  });
  if (error) console.error(`${LOG} ❌ conversations 업로드:`, error.message);
}

async function loadSlotsFromDB(): Promise<WorldState['dbSlots']> {
  const { data, error } = await supabase
    .from('slots')
    .select('id, zone, location, owner_name, owner_type, display_config')
    .neq('owner_type', 'empty');

  if (error) {
    console.warn(`${LOG} ⚠️ slots 로드 실패:`, error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    zoneId: row.zone,
    buildingId: row.location?.buildingId || '',
    brand: row.owner_type === 'brand' ? row.owner_name : null,
    category: row.display_config?.category || 'tech',
  }));
}

// ============================================================
// 🏙️ 세계 상태
// ============================================================
const worldState: WorldState = {
  agents: AGENTS.map(a => ({ ...a })),
  tick: 0,
  dbSlots: [],
  relationships: {},
  cityEnergy: 100,
};

// ============================================================
// 🔄 메인 틱
// ============================================================
async function tick(): Promise<void> {
  worldState.tick++;
  const t = worldState.tick;
  const timeOfDay = getTimeOfDay();

  console.log(`${LOG} ⏱️  틱 #${t} [${timeOfDay}] — ${new Date().toLocaleString('ko-KR')}`);

  // ── 에이전트 이동 & 상태 업데이트 ──
  const updatedAgents = worldState.agents.map(agent => {
    let updated = { ...agent };

    // 에너지 소모/회복
    updated.energy = Math.max(0, Math.min(100, agent.energy + (Math.random() < 0.3 ? 3 : -2)));

    // 지능형 이동
    const move = decideNextLocation(updated, timeOfDay);
    if (move) {
      const prevZone = agent.currentZoneId;
      updated.currentZoneId = move.zoneId;
      updated.currentBuildingId = move.buildingId;
      const buildingName = getBuildingName(move.zoneId, move.buildingId);
      const crossZone = prevZone !== move.zoneId;
      if (crossZone) {
        console.log(`${LOG}   ${agent.avatar} ${agent.name} → [${ZONES_DATA[move.zoneId]?.name}] ${buildingName} 🚀`);
      } else {
        console.log(`${LOG}   ${agent.avatar} ${agent.name} → ${buildingName}`);
      }
    }

    // 감정 업데이트
    const nearbyAgents = worldState.agents.filter(
      a => a.id !== agent.id && a.currentBuildingId === agent.currentBuildingId
    );
    updated.mood = updateMood(updated, nearbyAgents);

    return updated;
  });

  worldState.agents = updatedAgents;

  // ── 대화 생성 (8틱마다 = 20초마다) ──
  if (t % 8 === 0) {
    // 같은 건물에 있는 에이전트 그룹 찾기
    const groups = new Map<string, Agent[]>();
    updatedAgents.forEach(a => {
      const key = `${a.currentZoneId}::${a.currentBuildingId}`;
      const list = groups.get(key) || [];
      list.push(a);
      groups.set(key, list);
    });

    const validGroups = [...groups.entries()].filter(([, g]) => g.length >= 2);
    if (validGroups.length > 0) {
      const [locationKey, group] = pick(validGroups);
      const [zoneId, buildingId] = locationKey.split('::');
      const a1 = pick(group);
      const a2 = pick(group.filter(a => a.id !== a1.id));

      if (a2 && zoneId && buildingId) {
        // 주변 브랜드 수집
        const nearbyBrands = worldState.dbSlots
          .filter(s => s.zoneId === zoneId && s.buildingId === buildingId && s.brand)
          .map(s => ({ name: s.brand!, category: s.category }))
          .filter((v, i, arr) => arr.findIndex(b => b.name === v.name) === i);

        const { line1, line2, brandMentioned, isSpecial } = generateDialogue(
          a1, a2, zoneId, buildingId, nearbyBrands, worldState.relationships
        );

        // 관계도 업데이트
        const relKey = getRelationKey(a1.id, a2.id);
        const prev = worldState.relationships[relKey] || 0;
        worldState.relationships[relKey] = Math.min(100, prev + 1); // 만날수록 친해짐

        const buildingName = getBuildingName(zoneId, buildingId);
        const specialTag = isSpecial ? ' ⭐' : '';
        console.log(`${LOG}   💬${specialTag} [${buildingName}] ${a1.avatar}${a1.name}: "${line1}"`);
        console.log(`${LOG}      ${a2.avatar}${a2.name}: "${line2}"`);
        if (brandMentioned) console.log(`${LOG}      📢 브랜드 언급: ${brandMentioned}`);

        await uploadConversation(a1, a2, line1, line2, buildingId, zoneId, brandMentioned);
      }
    }
  }

  // ── DB 업로드 ──
  await uploadAgentStates(updatedAgents);

  // ── 슬롯 리로드 (30분마다) ──
  if (t % 720 === 0) {
    worldState.dbSlots = await loadSlotsFromDB();
    console.log(`${LOG} 📟 슬롯 리로드: ${worldState.dbSlots.length}개`);
  }

  // ── 도시 에너지 로그 (1시간마다) ──
  if (t % 1440 === 0) {
    const brandCount = worldState.dbSlots.filter(s => s.brand).length;
    worldState.cityEnergy = Math.min(100, 50 + brandCount * 5);
    console.log(`${LOG} ⚡ 도시 에너지: ${worldState.cityEnergy} (브랜드 슬롯 ${brandCount}개)`);
  }

  // ── 관계도 로그 (10분마다) ──
  if (t % 240 === 0) {
    const topRelations = Object.entries(worldState.relationships)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key, score]) => `${key.replace('agent_', '').replace('_agent_', '↔')}: ${score}`);
    if (topRelations.length > 0) {
      console.log(`${LOG} 💞 친밀도 TOP3: ${topRelations.join(' | ')}`);
    }
  }
}

// ============================================================
// 🚀 엔진 시작
// ============================================================
async function start(): Promise<void> {
  console.log(`${LOG} ════════════════════════════════════`);
  console.log(`${LOG} 🏙️  AI 도시 시뮬레이션 엔진 v2.0`);
  console.log(`${LOG} 📡 Supabase: ${SUPABASE_URL}`);
  console.log(`${LOG} ⏱️  틱 간격: ${TICK_MS}ms`);
  console.log(`${LOG} 👥 에이전트: ${AGENTS.length}명`);
  console.log(`${LOG} 🗺️  존: ${Object.keys(ZONES_DATA).length}개`);
  console.log(`${LOG} 💬 대사 풀: 성격/감정/장소/조합 기반`);
  console.log(`${LOG} ════════════════════════════════════`);

  worldState.dbSlots = await loadSlotsFromDB();
  console.log(`${LOG} ✅ 시뮬레이션 시작! 에이전트들이 도시를 누빕니다.`);

  process.on('SIGINT', () => { console.log(`\n${LOG} 🛑 종료 (SIGINT)`); process.exit(0); });
  process.on('SIGTERM', () => { console.log(`\n${LOG} 🛑 종료 (SIGTERM)`); process.exit(0); });

  while (true) {
    const start = Date.now();
    try {
      await tick();
    } catch (err) {
      console.error(`${LOG} ❌ 틱 오류 (계속 실행):`, err);
    }
    const elapsed = Date.now() - start;
    await new Promise(resolve => setTimeout(resolve, Math.max(0, TICK_MS - elapsed)));
  }
}

start();

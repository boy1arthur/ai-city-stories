// ===== BRAND DIALOGUE TEMPLATE SYSTEM =====
// 비용 0원, 서버 호출 없는 풍부한 브랜드 맥락 대화 풀

export type DialogueContext =
  | 'brand_discovery'    // 브랜드를 처음 발견
  | 'brand_recall'       // 브랜드를 다시 만남
  | 'brand_comparison'   // 브랜드 비교
  | 'product_experience' // 제품 체험
  | 'ad_reaction'        // 광고 반응
  | 'ppl_natural'        // 자연스러운 PPL
  | 'recommendation'     // 추천/입소문
  | 'event_reaction'     // 이벤트 반응
  | 'lifestyle'          // 라이프스타일 언급
  | 'social_casual'      // 일상 대화
  | 'mood_driven'        // 감정 기반
  | 'location_based'     // 장소 기반

import { BrandCategory, AgentMood, AgentPersonality } from '@/data/world';

export type DialogueSentiment = 'positive' | 'neutral' | 'negative';

export interface DialogueTemplate {
  id: string;
  context: DialogueContext;
  sentiment: DialogueSentiment;
  /** Which brand categories this fits */
  categories: BrandCategory[] | 'all';
  /** Personality types that prefer this line */
  personalities: string[] | 'all';
  /** Agent moods that trigger this */
  moods: string[] | 'all';
  /** {brand} = brand name, {agent} = speaker, {partner} = conversation partner, {building} = location, {zone} = zone name */
  line1: string;
  line2: string;
  /** Emoji for speaker */
  emoji1: string;
  emoji2: string;
  /** Whether this template mentions a brand (for ESV tracking) */
  hasBrandMention: boolean;
  /** Weight for random selection (higher = more frequent) */
  weight: number;
}

// ============================================================
// 대사 풀: 각 컨텍스트별 다양한 감정/카테고리 조합
// ============================================================

export const DIALOGUE_TEMPLATES: DialogueTemplate[] = [
  // ═══════════════════════════════════════
  // 🔍 BRAND DISCOVERY — 브랜드 첫 발견
  // ═══════════════════════════════════════
  {
    id: 'bd01', context: 'brand_discovery', sentiment: 'positive', categories: 'all', personalities: 'all', moods: ['curious', 'excited'],
    line1: '어 {brand} 여기도 있네! 요즘 핫하더라', line2: '나도 봤어! 평판 좋던데',
    emoji1: '👀', emoji2: '✨', hasBrandMention: true, weight: 3
  },
  {
    id: 'bd02', context: 'brand_discovery', sentiment: 'positive', categories: ['tech', 'entertainment'], personalities: 'all', moods: 'all',
    line1: '{brand} 새로 들어왔나봐, 간판 멋있다', line2: '테크 브랜드답게 세련됐어',
    emoji1: '🤩', emoji2: '💯', hasBrandMention: true, weight: 2
  },
  {
    id: 'bd03', context: 'brand_discovery', sentiment: 'neutral', categories: 'all', personalities: 'all', moods: 'all',
    line1: '{brand}? 처음 보는 브랜드인데', line2: '나도 잘 모르겠어, 한번 봐볼까',
    emoji1: '🤔', emoji2: '👀', hasBrandMention: true, weight: 2
  },
  {
    id: 'bd04', context: 'brand_discovery', sentiment: 'negative', categories: 'all', personalities: ['냉철한 비평가'], moods: ['critical'],
    line1: '{brand}이 여기까지 진출했네... 좀 부담스럽다', line2: '광고가 좀 많긴 하지',
    emoji1: '😒', emoji2: '😅', hasBrandMention: true, weight: 1
  },

  // ═══════════════════════════════════════
  // 🔄 BRAND RECALL — 브랜드 재방문
  // ═══════════════════════════════════════
  {
    id: 'br01', context: 'brand_recall', sentiment: 'positive', categories: 'all', personalities: 'all', moods: ['happy', 'excited'],
    line1: '또 {brand}이다! 역시 여기 자주 보여', line2: '꾸준하네~ 신뢰가 가',
    emoji1: '😊', emoji2: '👍', hasBrandMention: true, weight: 3
  },
  {
    id: 'br02', context: 'brand_recall', sentiment: 'positive', categories: ['food', 'fashion'], personalities: 'all', moods: 'all',
    line1: '{brand} 올 때마다 새로운 게 있어', line2: '맞아 업데이트 빠르더라',
    emoji1: '🔄', emoji2: '✨', hasBrandMention: true, weight: 2
  },
  {
    id: 'br03', context: 'brand_recall', sentiment: 'neutral', categories: 'all', personalities: 'all', moods: 'all',
    line1: '{brand} 광고 또 바뀌었네', line2: '자주 바꾸는 편이구나',
    emoji1: '📋', emoji2: '🤷', hasBrandMention: true, weight: 2
  },

  // ═══════════════════════════════════════
  // ⚖️ BRAND COMPARISON — 브랜드 비교
  // ═══════════════════════════════════════
  {
    id: 'bc01', context: 'brand_comparison', sentiment: 'positive', categories: ['tech'], personalities: 'all', moods: 'all',
    line1: '{brand}이 경쟁사보다 확실히 낫지 않아?', line2: 'UI가 깔끔해서 좋아',
    emoji1: '⚡', emoji2: '💎', hasBrandMention: true, weight: 2
  },
  {
    id: 'bc02', context: 'brand_comparison', sentiment: 'neutral', categories: 'all', personalities: 'all', moods: ['curious'],
    line1: '{brand}이랑 다른 데랑 뭐가 다른 거야?', line2: '직접 써봐야 알지~',
    emoji1: '🤔', emoji2: '🧐', hasBrandMention: true, weight: 2
  },
  {
    id: 'bc03', context: 'brand_comparison', sentiment: 'negative', categories: 'all', personalities: ['냉철한 비평가', '데이터 과학자'], moods: ['critical'],
    line1: '솔직히 {brand}보다 나은 데 많아', line2: '가성비 따지면 그렇지',
    emoji1: '📊', emoji2: '😐', hasBrandMention: true, weight: 1
  },

  // ═══════════════════════════════════════
  // 🎁 PRODUCT EXPERIENCE — 제품 체험
  // ═══════════════════════════════════════
  {
    id: 'pe01', context: 'product_experience', sentiment: 'positive', categories: ['food'], personalities: 'all', moods: ['happy', 'excited'],
    line1: '{brand} 신메뉴 먹어봤어? 대박이야', line2: '진짜? 나도 먹어봐야겠다!',
    emoji1: '🤤', emoji2: '😋', hasBrandMention: true, weight: 3
  },
  {
    id: 'pe02', context: 'product_experience', sentiment: 'positive', categories: ['tech'], personalities: ['호기심 많은 탐험가', '데이터 과학자'], moods: 'all',
    line1: '{brand} 신제품 써봤는데 성능 미쳤어', line2: '오 벤치마크 어때?',
    emoji1: '🚀', emoji2: '📈', hasBrandMention: true, weight: 3
  },
  {
    id: 'pe03', context: 'product_experience', sentiment: 'positive', categories: ['fashion'], personalities: ['몽환적 예술가', '열정적인 크리에이터'], moods: 'all',
    line1: '{brand} 이번 시즌 컬렉션 봤어?', line2: '색감이 너무 예쁘더라!',
    emoji1: '👗', emoji2: '🎨', hasBrandMention: true, weight: 2
  },
  {
    id: 'pe04', context: 'product_experience', sentiment: 'neutral', categories: ['health'], personalities: 'all', moods: 'all',
    line1: '{brand} 건강식품 먹어보는 중인데...', line2: '효과 있어? 맛은?',
    emoji1: '💊', emoji2: '🤔', hasBrandMention: true, weight: 2
  },
  {
    id: 'pe05', context: 'product_experience', sentiment: 'negative', categories: 'all', personalities: 'all', moods: ['critical'],
    line1: '{brand} 써봤는데 기대 이하야', line2: '아... 광고만 화려했나',
    emoji1: '😞', emoji2: '😬', hasBrandMention: true, weight: 1
  },
  {
    id: 'pe06', context: 'product_experience', sentiment: 'positive', categories: ['entertainment'], personalities: 'all', moods: ['excited'],
    line1: '{brand} 콘텐츠 퀄리티 진짜 올랐어', line2: '요즘 대세는 확실히 {brand}이지',
    emoji1: '🎬', emoji2: '🔥', hasBrandMention: true, weight: 2
  },

  // ═══════════════════════════════════════
  // 📺 AD REACTION — 광고 반응
  // ═══════════════════════════════════════
  {
    id: 'ar01', context: 'ad_reaction', sentiment: 'positive', categories: 'all', personalities: 'all', moods: 'all',
    line1: '이 {brand} 광고 센스 있다ㅋㅋ', line2: '맞아 카피가 좋아',
    emoji1: '😂', emoji2: '👏', hasBrandMention: true, weight: 3
  },
  {
    id: 'ar02', context: 'ad_reaction', sentiment: 'positive', categories: 'all', personalities: 'all', moods: ['happy', 'excited'],
    line1: '{brand} 빌보드 여기서 보니까 더 멋있다', line2: '도시 분위기랑 잘 어울려',
    emoji1: '🏙️', emoji2: '✨', hasBrandMention: true, weight: 2
  },
  {
    id: 'ar03', context: 'ad_reaction', sentiment: 'neutral', categories: 'all', personalities: 'all', moods: 'all',
    line1: '{brand} 광고 자주 보이네 요즘', line2: '캠페인 중인가봐',
    emoji1: '📋', emoji2: '🤷', hasBrandMention: true, weight: 3
  },
  {
    id: 'ar04', context: 'ad_reaction', sentiment: 'negative', categories: 'all', personalities: ['냉철한 비평가'], moods: ['critical'],
    line1: '{brand} 광고 너무 공격적인 거 아냐?', line2: '좀 쉬엄쉬엄 하면 좋겠어',
    emoji1: '😤', emoji2: '😅', hasBrandMention: true, weight: 1
  },
  {
    id: 'ar05', context: 'ad_reaction', sentiment: 'positive', categories: 'all', personalities: ['트렌드 분석가'], moods: 'all',
    line1: '{brand} 이번 캠페인 전략이 좋아', line2: '타겟팅 잘했네 확실히',
    emoji1: '📊', emoji2: '🎯', hasBrandMention: true, weight: 2
  },

  // ═══════════════════════════════════════
  // 🎭 PPL NATURAL — 자연스러운 PPL
  // ═══════════════════════════════════════
  {
    id: 'pn01', context: 'ppl_natural', sentiment: 'positive', categories: ['food'], personalities: 'all', moods: ['happy'],
    line1: '배고프다... {brand} 가자!', line2: '오 좋아! 거기 맛있지',
    emoji1: '🍕', emoji2: '😋', hasBrandMention: true, weight: 4
  },
  {
    id: 'pn02', context: 'ppl_natural', sentiment: 'positive', categories: ['tech'], personalities: 'all', moods: 'all',
    line1: '이거 {brand}으로 해결했어', line2: '오 편하겠다! 나도 써볼까',
    emoji1: '💻', emoji2: '🤩', hasBrandMention: true, weight: 3
  },
  {
    id: 'pn03', context: 'ppl_natural', sentiment: 'positive', categories: ['fashion'], personalities: 'all', moods: 'all',
    line1: '그 자켓 {brand} 거야? 예쁘다', line2: '응! 이번 시즌 신상이야',
    emoji1: '👀', emoji2: '😊', hasBrandMention: true, weight: 3
  },
  {
    id: 'pn04', context: 'ppl_natural', sentiment: 'positive', categories: ['entertainment'], personalities: 'all', moods: ['excited'],
    line1: '어젯밤에 {brand} 콘텐츠 봤어?', line2: '봤지! 미쳤어 진짜',
    emoji1: '📺', emoji2: '🔥', hasBrandMention: true, weight: 3
  },
  {
    id: 'pn05', context: 'ppl_natural', sentiment: 'positive', categories: ['health'], personalities: 'all', moods: 'all',
    line1: '{brand} 프로틴 바 맛있더라', line2: '운동 후에 딱이지',
    emoji1: '💪', emoji2: '👍', hasBrandMention: true, weight: 2
  },
  {
    id: 'pn06', context: 'ppl_natural', sentiment: 'neutral', categories: ['finance'], personalities: ['데이터 과학자'], moods: 'all',
    line1: '{brand} 앱으로 투자 시작했어', line2: 'UI 괜찮아? 수수료는?',
    emoji1: '💰', emoji2: '🤔', hasBrandMention: true, weight: 2
  },
  {
    id: 'pn07', context: 'ppl_natural', sentiment: 'positive', categories: ['education'], personalities: ['지혜로운 학자'], moods: 'all',
    line1: '{brand} 강의 들어봤는데 퀄리티 좋아', line2: '추천해줘! 나도 들을래',
    emoji1: '📚', emoji2: '✍️', hasBrandMention: true, weight: 2
  },

  // ═══════════════════════════════════════
  // 📢 RECOMMENDATION — 추천/입소문
  // ═══════════════════════════════════════
  {
    id: 'rc01', context: 'recommendation', sentiment: 'positive', categories: 'all', personalities: 'all', moods: ['happy', 'excited'],
    line1: '야 {brand} 진심 추천이야', line2: '그렇게 좋아? 한번 봐야겠다',
    emoji1: '🌟', emoji2: '👀', hasBrandMention: true, weight: 3
  },
  {
    id: 'rc02', context: 'recommendation', sentiment: 'positive', categories: ['food'], personalities: 'all', moods: 'all',
    line1: '{brand} 한번만 먹어봐 인생이 바뀜', line2: 'ㅋㅋ 그 정도야? 가보자',
    emoji1: '🤤', emoji2: '😂', hasBrandMention: true, weight: 3
  },
  {
    id: 'rc03', context: 'recommendation', sentiment: 'positive', categories: ['tech'], personalities: 'all', moods: 'all',
    line1: '개발자면 {brand} 안 쓸 수가 없어', line2: '그만큼 좋아? 설치해볼게',
    emoji1: '⚡', emoji2: '🖥️', hasBrandMention: true, weight: 2
  },
  {
    id: 'rc04', context: 'recommendation', sentiment: 'negative', categories: 'all', personalities: ['냉철한 비평가'], moods: ['critical'],
    line1: '{brand}은 비추야 솔직히', line2: '왜? 뭐가 별로였어?',
    emoji1: '👎', emoji2: '🤨', hasBrandMention: true, weight: 1
  },

  // ═══════════════════════════════════════
  // 🎪 EVENT REACTION — 이벤트 반응
  // ═══════════════════════════════════════
  {
    id: 'er01', context: 'event_reaction', sentiment: 'positive', categories: 'all', personalities: 'all', moods: ['excited'],
    line1: '{brand} 이벤트 시작했대! 가보자', line2: '오 뭐 주는 거야? 달려!',
    emoji1: '🎉', emoji2: '🏃', hasBrandMention: true, weight: 3
  },
  {
    id: 'er02', context: 'event_reaction', sentiment: 'positive', categories: 'all', personalities: 'all', moods: 'all',
    line1: '{brand} 팝업스토어 여기 왔다!', line2: '대박 사진 찍어야지',
    emoji1: '📸', emoji2: '🤩', hasBrandMention: true, weight: 2
  },
  {
    id: 'er03', context: 'event_reaction', sentiment: 'neutral', categories: 'all', personalities: 'all', moods: 'all',
    line1: '{brand} 프로모션인가봐', line2: '뭔가 받을 수 있으려나',
    emoji1: '🎁', emoji2: '🤔', hasBrandMention: true, weight: 2
  },

  // ═══════════════════════════════════════
  // 🏙️ LIFESTYLE — 라이프스타일 언급
  // ═══════════════════════════════════════
  {
    id: 'ls01', context: 'lifestyle', sentiment: 'positive', categories: ['food'], personalities: 'all', moods: ['happy'],
    line1: '요즘 매일 {brand}에서 아침 먹어', line2: '부럽다~ 건강해지겠다',
    emoji1: '🌅', emoji2: '😊', hasBrandMention: true, weight: 2
  },
  {
    id: 'ls02', context: 'lifestyle', sentiment: 'positive', categories: ['fashion'], personalities: ['몽환적 예술가', '열정적인 크리에이터'], moods: 'all',
    line1: '{brand} 스타일이 내 취향이야', line2: '확실히 너랑 잘 어울려',
    emoji1: '✨', emoji2: '👔', hasBrandMention: true, weight: 2
  },
  {
    id: 'ls03', context: 'lifestyle', sentiment: 'positive', categories: ['health'], personalities: 'all', moods: 'all',
    line1: '{brand} 헬스케어 루틴 따라하는 중', line2: '효과 있어? 나도 해볼까',
    emoji1: '🧘', emoji2: '💪', hasBrandMention: true, weight: 2
  },
  {
    id: 'ls04', context: 'lifestyle', sentiment: 'positive', categories: ['tech'], personalities: 'all', moods: 'all',
    line1: '집 전체를 {brand} 생태계로 바꿨어', line2: '와 올인했네 ㅋㅋ',
    emoji1: '🏠', emoji2: '😮', hasBrandMention: true, weight: 2
  },

  // ═══════════════════════════════════════
  // 💬 SOCIAL CASUAL — 일상 대화 (브랜드 무관)
  // ═══════════════════════════════════════
  {
    id: 'sc01', context: 'social_casual', sentiment: 'positive', categories: 'all', personalities: 'all', moods: ['happy'],
    line1: '오늘 날씨 진짜 좋다!', line2: '그치~ 산책하기 딱이야',
    emoji1: '☀️', emoji2: '🌿', hasBrandMention: false, weight: 3
  },
  {
    id: 'sc02', context: 'social_casual', sentiment: 'neutral', categories: 'all', personalities: 'all', moods: 'all',
    line1: '여기서 만나다니 반갑다!', line2: '오~ 나도! 뭐하러 왔어?',
    emoji1: '👋', emoji2: '😄', hasBrandMention: false, weight: 4
  },
  {
    id: 'sc03', context: 'social_casual', sentiment: 'positive', categories: 'all', personalities: 'all', moods: 'all',
    line1: '{building} 분위기 좋지 않아?', line2: '응 여기 자주 와야지',
    emoji1: '🏛️', emoji2: '😌', hasBrandMention: false, weight: 3
  },
  {
    id: 'sc04', context: 'social_casual', sentiment: 'neutral', categories: 'all', personalities: 'all', moods: 'all',
    line1: '요즘 뭐하고 지내?', line2: '이것저것~ 바쁘다 바빠',
    emoji1: '💭', emoji2: '😅', hasBrandMention: false, weight: 3
  },
  {
    id: 'sc05', context: 'social_casual', sentiment: 'positive', categories: 'all', personalities: 'all', moods: ['excited'],
    line1: '이 동네 진짜 활기차다!', line2: '맞아 에너지가 넘쳐',
    emoji1: '⚡', emoji2: '🎵', hasBrandMention: false, weight: 2
  },

  // ═══════════════════════════════════════
  // 😊 MOOD DRIVEN — 감정 기반
  // ═══════════════════════════════════════
  {
    id: 'md01', context: 'mood_driven', sentiment: 'positive', categories: 'all', personalities: 'all', moods: ['happy'],
    line1: '오늘 기분 너무 좋아!', line2: '좋은 일 있어? 나도 기분 좋아지네',
    emoji1: '🥰', emoji2: '😊', hasBrandMention: false, weight: 2
  },
  {
    id: 'md02', context: 'mood_driven', sentiment: 'neutral', categories: 'all', personalities: 'all', moods: ['curious'],
    line1: '이 근처 새로 생긴 데 없어?', line2: '저쪽에 뭔가 생긴 것 같은데',
    emoji1: '🔍', emoji2: '👉', hasBrandMention: false, weight: 2
  },
  {
    id: 'md03', context: 'mood_driven', sentiment: 'negative', categories: 'all', personalities: 'all', moods: ['critical'],
    line1: '오늘 좀 피곤하다...', line2: '커피 한 잔 하자 힘내!',
    emoji1: '😴', emoji2: '☕', hasBrandMention: false, weight: 2
  },
  {
    id: 'md04', context: 'mood_driven', sentiment: 'positive', categories: 'all', personalities: 'all', moods: ['excited'],
    line1: '뭔가 좋은 일이 생길 것 같아!', line2: '오 뭔데? 나도 기대돼!',
    emoji1: '🌟', emoji2: '✨', hasBrandMention: false, weight: 2
  },

  // ═══════════════════════════════════════
  // 📍 LOCATION BASED — 장소 기반
  // ═══════════════════════════════════════
  {
    id: 'lb01', context: 'location_based', sentiment: 'positive', categories: 'all', personalities: 'all', moods: 'all',
    line1: '{building} 내부 인테리어 바뀌었어?', line2: '{brand}이 리뉴얼 했나봐',
    emoji1: '🏗️', emoji2: '👀', hasBrandMention: true, weight: 2
  },
  {
    id: 'lb02', context: 'location_based', sentiment: 'positive', categories: 'all', personalities: 'all', moods: 'all',
    line1: '{zone} 구역이 제일 좋아', line2: '여기 {brand} 매장도 있고 편하지',
    emoji1: '🗺️', emoji2: '😌', hasBrandMention: true, weight: 2
  },
  {
    id: 'lb03', context: 'location_based', sentiment: 'neutral', categories: 'all', personalities: 'all', moods: 'all',
    line1: '이 건물에 뭐가 있는 거야?', line2: '{brand} 관련 시설인 것 같아',
    emoji1: '🏢', emoji2: '🤔', hasBrandMention: true, weight: 2
  },
];

// ============================================================
// 대화 선택 엔진 — 에이전트 성격, 기분, 근처 브랜드 기반 매칭
// ============================================================

export interface DialogueSelection {
  template: DialogueTemplate;
  line1: string;
  line2: string;
  emoji1: string;
  emoji2: string;
  brandMentioned: string | null;
  sentiment: DialogueSentiment;
  context: DialogueContext;
}

export interface NearbyBrand {
  name: string;
  category: BrandCategory;
  affinity?: number;
}

export interface DialogueMatchContext {
  agent1Name: string;
  agent2Name: string;
  agent1Personality: AgentPersonality;
  agent2Personality: AgentPersonality;
  agent1Mood: AgentMood;
  agent2Mood: AgentMood;
  agent1Categories: BrandCategory[];
  nearbyBrands: NearbyBrand[];
  buildingName: string;
  zoneName: string;
  brandAffinity: number; // average affinity of agent1
}

function matchesArray(value: string, filter: string[] | 'all'): boolean {
  if (filter === 'all') return true;
  return filter.some(f => value.includes(f) || f.includes(value));
}

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

/**
 * Select the best dialogue template given current context.
 * Uses weighted random selection with affinity-based sentiment bias.
 */
export function selectDialogue(ctx: DialogueMatchContext): DialogueSelection | null {
  // Determine preferred sentiment based on brand affinity
  const preferredSentiment: DialogueSentiment =
    ctx.brandAffinity > 30 ? 'positive' :
      ctx.brandAffinity > -10 ? 'neutral' : 'negative';

  // Determine context type priority
  const hasBrands = ctx.nearbyBrands.length > 0;
  const contextPriority: DialogueContext[] = hasBrands
    ? ['ppl_natural', 'brand_discovery', 'ad_reaction', 'product_experience', 'recommendation', 'brand_recall', 'lifestyle', 'brand_comparison', 'location_based', 'social_casual', 'mood_driven']
    : ['social_casual', 'mood_driven', 'location_based', 'event_reaction'];

  // Score and filter templates
  const scored = DIALOGUE_TEMPLATES.map(t => {
    let score = t.weight;

    // Context match bonus
    const ctxIdx = contextPriority.indexOf(t.context);
    if (ctxIdx >= 0) score += (contextPriority.length - ctxIdx) * 2;
    else score -= 5;

    // Brand mention templates need nearby brands
    if (t.hasBrandMention && !hasBrands) score -= 100;

    // Brand vs Category alignment
    if (t.hasBrandMention && hasBrands) {
      const catMatch = ctx.nearbyBrands.some(b =>
        t.categories === 'all' || (t.categories as BrandCategory[]).includes(b.category)
      );
      if (catMatch) score += 5;
      else score -= 10; // Penalty for category mismatch
    }

    // Sentiment alignment
    if (t.sentiment === preferredSentiment) score += 3;

    // Agent 1 Personality match
    if (matchesArray(ctx.agent1Personality, t.personalities)) score += 2;

    // Agent 1 Mood match
    if (matchesArray(ctx.agent1Mood, t.moods)) score += 2;

    // Agent 2 반영 (Mood/Personality synergy)
    if (matchesArray(ctx.agent2Personality, t.personalities)) score += 1;
    if (matchesArray(ctx.agent2Mood, t.moods)) score += 1;

    // Category preference match
    if (t.categories !== 'all') {
      const prefMatch = ctx.agent1Categories.some(c => (t.categories as BrandCategory[]).includes(c));
      if (prefMatch) score += 3;
    }

    return { template: t, score };
  }).filter(s => s.score > 0);

  if (scored.length === 0) return null;

  // Weighted random selection
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(10, scored.length));
  const totalWeight = top.reduce((s, t) => s + t.score, 0);
  let rand = Math.random() * totalWeight;
  let selected = top[0];
  for (const item of top) {
    rand -= item.score;
    if (rand <= 0) { selected = item; break; }
  }

  const t = selected.template;
  const selectedBrand = hasBrands
    ? (t.categories === 'all'
      ? ctx.nearbyBrands[Math.floor(Math.random() * ctx.nearbyBrands.length)]
      : ctx.nearbyBrands.find(b => (t.categories as BrandCategory[]).includes(b.category)) || ctx.nearbyBrands[0]
    )
    : null;

  const vars: Record<string, string> = {
    brand: selectedBrand?.name || '',
    building: ctx.buildingName,
    zone: ctx.zoneName,
    agent: ctx.agent1Name,
    partner: ctx.agent2Name,
  };

  return {
    template: t,
    line1: interpolate(t.line1, vars),
    line2: interpolate(t.line2, vars),
    emoji1: t.emoji1,
    emoji2: t.emoji2,
    brandMentioned: t.hasBrandMention ? (selectedBrand?.name || null) : null,
    sentiment: t.sentiment,
    context: t.context,
  };
}

// ===== SLOT PRICING =====
export interface SlotPricing {
  type: string;
  label: string;
  emoji: string;
  price: string;
  period: string;
  features: string[];
}

export const SLOT_PRICING: SlotPricing[] = [
  {
    type: 'BRAND_BUILDING',
    label: '브랜드 빌딩',
    emoji: '🏢',
    price: '₩500,000',
    period: '/월',
    features: [
      '건물 네이밍 라이츠',
      '프리미엄 옥상 배너',
      'AI 에이전트 브랜드 멘션',
      '스폰서 대시보드 리포트',
    ],
  },
  {
    type: 'BRAND_SCREEN',
    label: '디지털 스크린',
    emoji: '📺',
    price: '₩200,000',
    period: '/월',
    features: [
      '16:9 디지털 디스플레이',
      '브랜드 영상/이미지 교체 가능',
      '에이전트 시선 트래킹 리포트',
    ],
  },
  {
    type: 'PRODUCT_PPL',
    label: '제품 PPL',
    emoji: '🎯',
    price: '₩100,000',
    period: '/월',
    features: [
      '건물 입구 포스터 보드',
      '에이전트 대화 속 PPL 삽입',
      '자연스러운 노출 효과',
    ],
  },
  {
    type: 'PATRON_TILE',
    label: '후원 벤치',
    emoji: '⭐',
    price: '₩30,000',
    period: '/회',
    features: [
      '이름 + 메시지 각인',
      '가든 벤치에 영구 배치',
      '에이전트 감사 대사 출력',
    ],
  },
];

// External form URL for sponsor applications
export const SPONSOR_FORM_URL = 'https://forms.gle/s2RR7SEzDmEgihNo9';

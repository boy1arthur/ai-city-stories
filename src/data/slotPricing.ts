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
    label: '플래그십 빌딩 패키지',
    emoji: '🏢',
    price: '₩7,000,000',
    period: '/월',
    features: [
      '건물 외관 브랜드 스킨 적용',
      '옥상 프리미엄 배너 표시',
      '벽면 디지털 스크린 포함',
      '에이전트 대화 내 브랜드 멘션',
      '스폰서 대시보드 노출 리포트',
    ],
  },
  {
    type: 'NAMING_RIGHTS',
    label: '네이밍 라이츠',
    emoji: '🏷️',
    price: '₩3,500,000',
    period: '/월',
    features: [
      '건물 벽면 대형 브랜드 배너',
      '맵 위 브랜드 로고·이니셜 표시',
      '에이전트 대화 내 건물명 반영',
    ],
  },
  {
    type: 'PRODUCT_PPL',
    label: '제품 PPL',
    emoji: '🎯',
    price: '₩1,800,000',
    period: '/월',
    features: [
      '건물 입구 포스터 보드 배치',
      'AI 에이전트 대화 속 자연스러운 PPL',
      '맵 내 제품 아이콘 노출',
    ],
  },
  {
    type: 'BILLBOARD',
    label: '빌보드',
    emoji: '📋',
    price: '₩1,200,000',
    period: '/월',
    features: [
      '도로변 빌보드 브랜드명 표시',
      '브랜드 로고·컬러 적용',
      '맵 가장자리 독립 빌보드 배치',
    ],
  },
  {
    type: 'KIOSK',
    label: '키오스크',
    emoji: '🏪',
    price: '₩800,000',
    period: '/월',
    features: [
      '보행로 키오스크 광고판 표시',
      '브랜드명·로고 표시',
      '클릭 시 브랜드 정보 모달',
    ],
  },
  {
    type: 'BUS_STOP',
    label: '버스 정류장 광고',
    emoji: '🚏',
    price: '₩600,000',
    period: '/월',
    features: [
      '정류장 쉘터 내 광고판 표시',
      '브랜드명·로고 컬러 적용',
      '클릭 시 브랜드 정보 모달',
    ],
  },
  {
    type: 'PATRON_TILE',
    label: '후원 벤치',
    emoji: '⭐',
    price: '₩150,000',
    period: '/회',
    features: [
      '벤치에 이름·메시지 각인',
      '맵 내 영구 배치',
      '클릭 시 후원자 메시지 표시',
    ],
  },
];

// External form URL for sponsor applications
export const SPONSOR_FORM_URL = 'https://forms.gle/s2RR7SEzDmEgihNo9';

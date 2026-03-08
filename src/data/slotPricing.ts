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
    label: '플래그십 빌딩',
    emoji: '🏢',
    price: '$5,000',
    period: '/월',
    features: [
      '건물 전체 네이밍 & 외관 스킨',
      '옥상 프리미엄 배너 독점',
      'AI 에이전트 브랜드 스토리 생성',
      '실시간 브랜드 감정 분석 대시보드',
      '월간 ESV 리포트 & 인사이트',
    ],
  },
  {
    type: 'BRAND_ZONE',
    label: '테마 구역 독점',
    emoji: '🌆',
    price: '$12,000',
    period: '/월',
    features: [
      '구역 전체 브랜딩 (건물·도로·타일)',
      '구역 내 모든 스크린 우선 배치권',
      'AI 에이전트 구역 전용 대사 커스텀',
      '구역 이벤트 스폰서 독점권',
      '경쟁사 광고 차단 (Exclusivity)',
    ],
  },
  {
    type: 'BRAND_SCREEN',
    label: '디지털 스크린',
    emoji: '📺',
    price: '$2,500',
    period: '/월',
    features: [
      '16:9 디지털 디스플레이 독점',
      '브랜드 영상·이미지 무제한 교체',
      '에이전트 시선 트래킹 히트맵',
      '노출 횟수·체류 시간 분석',
    ],
  },
  {
    type: 'MULTI_BUILDING_AD',
    label: '멀티 빌딩 캔버스',
    emoji: '🎨',
    price: '$8,000',
    period: '/월',
    features: [
      '다수 건물 벽면 연결 초대형 광고',
      '도시 스카이라인 브랜드 점령',
      'Times Square 스타일 임팩트',
      'SNS 바이럴 스크린샷 유도',
    ],
  },
  {
    type: 'NAMING_RIGHTS',
    label: '네이밍 라이츠',
    emoji: '🏷️',
    price: '$3,500',
    period: '/월',
    features: [
      '건물 벽면 브랜드 배너 설치',
      '에이전트 대화 내 건물명 변경',
      '월드 로그 브랜드 노출',
      '맵 범례 브랜드 표시',
    ],
  },
  {
    type: 'PRODUCT_PPL',
    label: '제품 PPL',
    emoji: '🎯',
    price: '$1,800',
    period: '/월',
    features: [
      '건물 내부 제품 자연 배치',
      'AI 에이전트 대화 속 PPL 삽입',
      '스토리라인 연계 제품 노출',
      '구매 전환 추적 시뮬레이션',
    ],
  },
  {
    type: 'BILLBOARD',
    label: '빌보드',
    emoji: '📋',
    price: '$1,200',
    period: '/월',
    features: [
      '도로변 대형 빌보드 설치',
      '에이전트 이동 경로 기반 노출',
      '일일 노출 횟수 리포트',
    ],
  },
  {
    type: 'KIOSK',
    label: '키오스크',
    emoji: '🏪',
    price: '$800',
    period: '/월',
    features: [
      '보행로 키오스크 광고판',
      '에이전트 인터랙션 가능',
      '근거리 노출 집중 효과',
    ],
  },
  {
    type: 'BUS_STOP',
    label: '버스 정류장 광고',
    emoji: '🚏',
    price: '$600',
    period: '/월',
    features: [
      '정류장 쉘터 내 광고판',
      '대기 에이전트 집중 노출',
      '교통 허브 유동인구 활용',
    ],
  },
  {
    type: 'PATRON_TILE',
    label: '후원 벤치',
    emoji: '⭐',
    price: '$150',
    period: '/회',
    features: [
      '이름 + 메시지 각인 (영구)',
      '가든 벤치에 배치',
      '에이전트 감사 대사 출력',
      '후원자 명예의 전당 등재',
    ],
  },
];

// External form URL for sponsor applications
export const SPONSOR_FORM_URL = 'https://forms.gle/s2RR7SEzDmEgihNo9';

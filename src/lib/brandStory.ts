// ===== BRAND STORY TEMPLATES =====
// Agent dialogue templates triggered by sponsored buildings/benches

import type { Slot } from '@/data/slots';

export interface BrandStoryLine {
  trigger: 'enter_building' | 'sit_bench' | 'pass_by';
  templates: string[];
}

/** Get a random dialogue line for agent interaction with sponsored content */
export function getBrandDialogue(
  slot: Slot,
  trigger: BrandStoryLine['trigger'],
  agentName: string
): string | null {
  if (slot.ownerType === 'empty') return null;

  const ownerName = slot.ownerName || '후원자';

  const lines: Record<string, Record<BrandStoryLine['trigger'], string[]>> = {
    BRAND_BUILDING: {
      enter_building: [
        `오늘은 ${ownerName}이(가) 후원한 건물이네! 감사합니다 🙏`,
        `${ownerName} 로비 분위기 좋다~ ✨`,
        `여기가 ${ownerName} 본사구나, 멋지다!`,
      ],
      sit_bench: [],
      pass_by: [
        `${ownerName} 건물 앞을 지나는 중...`,
        `저기 ${ownerName} 간판이 보인다 👀`,
      ],
    },
    PATRON_TILE: {
      enter_building: [],
      sit_bench: [
        `이 벤치는 ${ownerName}님이 기부했대요 💛`,
        `${ownerName}님 감사합니다! 여기 앉으니 편하다~`,
        `"${slot.ownerMessage || '응원합니다'}" — ${ownerName}`,
      ],
      pass_by: [
        `${ownerName}님의 벤치다! 잠깐 쉬어갈까?`,
      ],
    },
    BRAND_SCREEN: {
      enter_building: [],
      sit_bench: [],
      pass_by: [
        `${ownerName} 광고 화면이 멋지다 📺`,
        `저 스크린에서 ${ownerName} 영상 나온다!`,
      ],
    },
    PRODUCT_PPL: {
      enter_building: [
        `오, ${ownerName} 제품이 여기도 있네!`,
      ],
      sit_bench: [],
      pass_by: [
        `${ownerName} 포스터를 봤어, 관심이 간다 🎯`,
      ],
    },
  };

  const typeLines = lines[slot.type]?.[trigger];
  if (!typeLines || typeLines.length === 0) return null;

  return typeLines[Math.floor(Math.random() * typeLines.length)];
}

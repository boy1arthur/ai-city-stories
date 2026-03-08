import type { Slot } from '@/data/slots';

/**
 * Generate template-based dialogue message for a slot.
 * This function will later be replaced by an AI API call via Edge Function.
 */
export function getSlotMessage(slot: Slot): { title: string; message: string; emoji: string } {
  // Guide NPC (virtual slot)
  if ((slot as any).type === 'SYSTEM_GUIDE') {
    return {
      title: '🧭 Plaza Guide',
      emoji: '🧭',
      message: '이 도시는 AI가 사는 세상입니다.\n건물과 벤치, 도로는 브랜드와 후원자가 이름을 남길 수 있는 슬롯입니다.\n각 슬롯을 클릭해서 자세히 알아보세요!',
    };
  }

  if (slot.ownerType === 'empty') {
    return {
      title: '빈 슬롯',
      emoji: '✨',
      message: '이 자리는 아직 비어 있습니다.\n나중에 후원이나 브랜드로 채울 수 있어요.',
    };
  }

  switch (slot.type) {
    case 'BRAND_BUILDING':
      return {
        title: slot.label,
        emoji: '🏢',
        message: `여기는 ${slot.ownerName || slot.label} 브랜드의 메인 허브입니다.\n프리미엄 광고 슬롯으로 도시에서 가장 눈에 띄는 위치입니다.`,
      };

    case 'PATRON_TILE':
      return {
        title: `후원자: ${slot.ownerName || '익명'}`,
        emoji: '⭐',
        message: `이 벤치는 후원자 ${slot.ownerName || '익명'}님이 AI 시티에 기부했습니다.\n"${slot.ownerMessage || slot.label}"`,
      };

    case 'PRODUCT_PPL':
      return {
        title: slot.label,
        emoji: '🎯',
        message: `${slot.label} 제품이 이 공간의 일상 속에 자연스럽게 녹아 있습니다.`,
      };

    case 'BRAND_SCREEN':
      return {
        title: slot.label,
        emoji: '📺',
        message: `디지털 스크린에서 ${slot.ownerName || '광고'} 콘텐츠가 재생 중입니다.\n향후 Times Square 확장의 프리뷰입니다.`,
      };

    default:
      return {
        title: slot.label,
        emoji: '📍',
        message: slot.label,
      };
  }
}

/**
 * Handle slot interaction — currently opens a modal.
 * Later this will call an Edge Function with aiHookId.
 */
export function handleSlotInteraction(
  slot: Slot,
  openModal: (data: { title: string; message: string; emoji: string; slot: Slot }) => void
): void {
  // Only handle click triggers (or undefined = default click)
  if (slot.triggerType && slot.triggerType !== 'click') return;

  const msgData = getSlotMessage(slot);
  openModal({ ...msgData, slot });
}

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Slot } from '@/data/slots';

interface SlotModalData {
  title: string;
  message: string;
  emoji: string;
  slot: Slot;
}

interface Props {
  data: SlotModalData | null;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  BRAND_BUILDING: 'hsl(38,75%,50%)',
  BRAND_SCREEN: 'hsl(200,60%,50%)',
  PRODUCT_PPL: 'hsl(150,45%,45%)',
  PATRON_TILE: 'hsl(38,50%,60%)',
  SYSTEM_GUIDE: 'hsl(210,60%,55%)',
};

const TYPE_LABELS: Record<string, string> = {
  BRAND_BUILDING: '브랜드 빌딩',
  BRAND_SCREEN: '디지털 스크린',
  PRODUCT_PPL: '제품 PPL',
  PATRON_TILE: '후원 타일',
  SYSTEM_GUIDE: '가이드',
};

export const SlotInteractionModal: React.FC<Props> = ({ data, onClose }) => {
  if (!data) return null;

  const color = TYPE_COLORS[data.slot.type] || 'hsl(215,30%,50%)';
  const typeLabel = TYPE_LABELS[data.slot.type] || data.slot.type;

  return (
    <Dialog open={!!data} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm border-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
              style={{ background: color, color: 'hsl(0,0%,100%)' }}
            >
              {typeLabel}
            </span>
            {data.slot.ownerType === 'empty' && (
              <span className="text-[10px] text-muted-foreground font-mono">AVAILABLE</span>
            )}
          </div>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <span className="text-xl">{data.emoji}</span>
            {data.title}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {data.message}
          </div>
        </DialogDescription>
        {data.slot.ownerType === 'empty' && (
          <div className="mt-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 text-xs text-primary">
            💡 이 슬롯은 후원이나 브랜드 파트너십을 통해 활성화할 수 있습니다.
          </div>
        )}
        {data.slot.aiHookId && (
          <div className="mt-1 text-[10px] text-muted-foreground font-mono">
            AI Hook: {data.slot.aiHookId}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

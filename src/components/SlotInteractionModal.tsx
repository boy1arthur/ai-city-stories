import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Slot } from '@/data/slots';
import { SLOT_PRICING, SPONSOR_FORM_URL } from '@/data/slotPricing';

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
  const pricing = SLOT_PRICING.find(p => p.type === data.slot.type);
  const isEmpty = data.slot.ownerType === 'empty';

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
            {isEmpty && (
              <span className="text-[10px] text-muted-foreground font-mono">AVAILABLE</span>
            )}
            {!isEmpty && (
              <span className="text-[10px] font-mono" style={{ color }}>SPONSORED</span>
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

        {/* Pricing info for empty slots */}
        {isEmpty && pricing && (
          <div className="mt-3 space-y-3">
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-lg font-bold text-foreground">{pricing.price}</span>
                <span className="text-xs text-muted-foreground">{pricing.period}</span>
              </div>
              <ul className="space-y-1">
                {pricing.features.map((f, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="text-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              className="w-full"
              onClick={() => window.open(SPONSOR_FORM_URL, '_blank')}
            >
              🚀 이 자리 후원 신청하기
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              신청서 작성 후 운영팀이 확인하여 연락드립니다
            </p>
          </div>
        )}

        {/* Sponsored slot info */}
        {!isEmpty && data.slot.ownerName && (
          <div className="mt-2 p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">
                {data.slot.type === 'PATRON_TILE' ? '⭐' : '👑'} {data.slot.ownerName}
              </span>
            </div>
            {data.slot.ownerMessage && (
              <p className="text-xs text-muted-foreground italic">
                "{data.slot.ownerMessage}"
              </p>
            )}
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

import React, { useState } from 'react';
import type { AdSlot, Zone } from '@/data/world';
import { VIRTUAL_BRANDS } from '@/data/demoSeed';
import { AD_SLOT_LABELS } from '@/data/world';

interface Props {
  zones: Zone[];
  allAdSlots: AdSlot[];
  currentTick: number;
  onCreateCampaign: (input: {
    brandId: string;
    zoneId: string;
    slotIds: string[];
    durationTicks: number;
    startTick: number;
  }) => void;
}

const DURATION_PRESETS = [
  { label: '짧게 (100 ticks)', value: 100 },
  { label: '보통 (300 ticks)', value: 300 },
  { label: '길게 (500 ticks)', value: 500 },
];

export const CampaignForm: React.FC<Props> = ({ zones, allAdSlots, currentTick, onCreateCampaign }) => {
  const [brandId, setBrandId] = useState(VIRTUAL_BRANDS[0].name);
  const [zoneId, setZoneId] = useState('plaza');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [duration, setDuration] = useState(300);

  const availableZones = zones.filter(z => !z.locked);
  const zoneSlots = allAdSlots.filter(s => s.zoneId === zoneId);

  const toggleSlot = (slotId: string) => {
    setSelectedSlots(prev =>
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  const handleSubmit = () => {
    if (selectedSlots.length === 0) return;
    onCreateCampaign({
      brandId,
      zoneId,
      slotIds: selectedSlots,
      durationTicks: duration,
      startTick: currentTick,
    });
    setSelectedSlots([]);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">📋 새 캠페인 생성</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Brand */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">브랜드</label>
          <select value={brandId} onChange={e => setBrandId(e.target.value)}
            className="w-full text-xs bg-muted border border-border rounded px-2 py-1.5 text-foreground">
            {VIRTUAL_BRANDS.map(b => (
              <option key={b.name} value={b.name}>{b.name} ({b.category})</option>
            ))}
          </select>
        </div>

        {/* Zone */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">구역</label>
          <select value={zoneId} onChange={e => { setZoneId(e.target.value); setSelectedSlots([]); }}
            className="w-full text-xs bg-muted border border-border rounded px-2 py-1.5 text-foreground">
            {availableZones.map(z => (
              <option key={z.id} value={z.id}>{z.emoji} {z.name}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">기간</label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))}
            className="w-full text-xs bg-muted border border-border rounded px-2 py-1.5 text-foreground">
            {DURATION_PRESETS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Slot selection */}
      <div className="mb-4">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">슬롯 선택</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
          {zoneSlots.map(slot => {
            const isSelected = selectedSlots.includes(slot.id);
            const building = availableZones.find(z => z.id === zoneId)?.buildings.find(b => b.id === slot.buildingId);
            return (
              <button key={slot.id} onClick={() => toggleSlot(slot.id)}
                className={`text-left text-[11px] px-2 py-1.5 rounded border transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
                }`}>
                <span className="font-semibold">{building?.emoji} {AD_SLOT_LABELS[slot.type]}</span>
                <span className="block text-[9px] opacity-70">{building?.name} • {slot.brand ? `🟡 ${slot.brand}` : '빈 슬롯'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={handleSubmit} disabled={selectedSlots.length === 0}
        className="text-xs px-4 py-1.5 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        캠페인 생성 ({selectedSlots.length}슬롯)
      </button>
    </div>
  );
};

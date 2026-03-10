import React from 'react';
import { type Building, type Agent, type AdSlot, type BrandCategory, AD_SLOT_LABELS, BRAND_CATEGORIES } from '@/data/world';

interface Props {
  selectedBuilding: Building | null;
  selectedAgent: Agent | null;
  adSlots: AdSlot[];
  onPlaceAd: (slotId: string, brand: string, category: BrandCategory) => void;
  onClose: () => void;
}

export const WorldPanel: React.FC<Props> = ({ selectedBuilding, selectedAgent, adSlots, onPlaceAd, onClose }) => {
  const [brandInput, setBrandInput] = React.useState('');
  const [categoryInput, setCategoryInput] = React.useState<BrandCategory>('tech');

  if (!selectedBuilding && !selectedAgent) return null;

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-card/95 backdrop-blur-md border-l border-border p-4 overflow-y-auto z-20">
      <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-xs">✕ 닫기</button>

      {selectedBuilding && (
        <div>
          <div className="text-2xl mb-1">{selectedBuilding.emoji}</div>
          <h2 className="text-lg font-bold text-foreground mb-1">{selectedBuilding.name}</h2>
          <p className="text-xs text-muted-foreground mb-4">{selectedBuilding.description}</p>

          <h3 className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">광고 슬롯</h3>
          <div className="space-y-2 mb-4">
            {adSlots.filter(s => s.buildingId === selectedBuilding.id).map(slot => (
              <div key={slot.id} className="bg-muted rounded-md p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground font-medium">{AD_SLOT_LABELS[slot.type]}</span>
                  <span className="text-xs text-accent font-mono">ESV: {slot.esv}</span>
                </div>
                {slot.brand ? (
                  <div className="text-xs text-primary font-medium">📢 {slot.brand}</div>
                ) : (
                  <div className="text-xs text-muted-foreground">비어 있음</div>
                )}
                <div className="text-xs text-muted-foreground">노출: {slot.impressions}</div>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">광고 배치</h3>
          <div className="flex flex-col gap-2">
            <select
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value as BrandCategory)}
              className="bg-muted border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              {BRAND_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                value={brandInput}
                onChange={e => setBrandInput(e.target.value)}
                placeholder="브랜드명 입력"
                className="flex-1 bg-muted border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => {
                  const emptySlot = adSlots.find(s => s.buildingId === selectedBuilding.id && !s.brand);
                  if (emptySlot && brandInput) {
                    onPlaceAd(emptySlot.id, brandInput, categoryInput);
                    setBrandInput('');
                  }
                }}
                className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                배치
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAgent && (
        <div>
          <div className="text-3xl mb-2">{selectedAgent.avatar}</div>
          <h2 className="text-lg font-bold text-foreground mb-0">{selectedAgent.name}</h2>
          <p className="text-xs text-muted-foreground mb-1">{selectedAgent.personality}</p>
          <div className="inline-block bg-muted rounded-full px-2 py-0.5 text-xs text-foreground mb-4">
            {selectedAgent.mood === 'happy' && '😊'}
            {selectedAgent.mood === 'curious' && '🤔'}
            {selectedAgent.mood === 'critical' && '😤'}
            {selectedAgent.mood === 'neutral' && '😐'}
            {selectedAgent.mood === 'excited' && '🤩'}
            {' '}{selectedAgent.mood}
          </div>

          <h3 className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">브랜드 친밀도</h3>
          <div className="space-y-2">
            {selectedAgent.brandAffinities.map(ba => (
              <div key={ba.category} className="flex items-center gap-2">
                <span className="text-xs text-foreground w-20">{ba.category}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.abs(ba.score)}%`,
                      backgroundColor: ba.score > 0 ? 'hsl(145,35%,42%)' : 'hsl(0,60%,48%)',
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-8 text-right">{ba.score}</span>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-semibold text-primary mt-4 mb-2 uppercase tracking-wider">선호 카테고리</h3>
          <div className="flex gap-1 flex-wrap">
            {selectedAgent.favoriteCategories.map(c => (
              <span key={c} className="bg-secondary/20 text-secondary text-xs px-2 py-0.5 rounded-full">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

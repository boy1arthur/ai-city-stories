import { pickRandom } from '@/lib/utils'; // Assuming this exists or will be created
import { findPath, pathLength, type Waypoint } from '@/lib/pathfinding';
import { generateBrandDialogue, getZoneById, type Agent, type AdSlot, type InteractionEvent, type Building } from '@/data/world';
import { REACTION_EMOJIS, IDLE_THOUGHTS, getAgentPositionAroundBuilding } from './constants';
import type { AgentVisualState, AdReaction, SpeechBubble } from './types';

const WALK_SPEED = 1.2; // grid units per second — leisurely walking pace

export function processAgentMovement(
    agent: Agent,
    agentIndex: number,
    now: number,
    adSlots: AdSlot[],
    agentVisualsRefMap: Map<string, AgentVisualState>,
    currentZoneId: string,
    addLog: (msg: string) => void,
    addInteraction: (event: InteractionEvent) => void,
    addAdReaction: (reaction: AdReaction) => void,
    addSpeechBubble: (bubble: SpeechBubble) => void,
    setAgentVisuals: (updater: (prev: Map<string, AgentVisualState>) => Map<string, AgentVisualState>) => void,
    setAdSlots: (updater: (prev: AdSlot[]) => AdSlot[]) => void
): Agent {
    const agentZone = getZoneById(agent.currentZoneId);
    if (!agentZone || agentZone.locked) return agent;

    const currentVisual = agentVisualsRefMap.get(agent.id);
    const isCurrentlyMoving = currentVisual?.isMoving && (now - currentVisual.moveStartTime < currentVisual.moveDuration);

    if (!isCurrentlyMoving && Math.random() < 0.18) {
        const zoneBuildings = agentZone.buildings;
        if (zoneBuildings.length === 0) return agent;
        const newBuilding = pickRandom(zoneBuildings);
        if (newBuilding.id !== agent.currentBuildingId) {
            const oldBuilding = zoneBuildings.find(b => b.id === agent.currentBuildingId);
            addLog(`${agent.avatar} ${agent.name} → ${newBuilding.name}`);

            // Animate movement
            if (oldBuilding) {
                const fromPos = getAgentPositionAroundBuilding(oldBuilding, agentIndex);
                const toPos = getAgentPositionAroundBuilding(newBuilding, agentIndex);

                const waypointPath = findPath(oldBuilding, newBuilding);
                const totalDist = pathLength(waypointPath);
                const duration = Math.max(4000, (totalDist / WALK_SPEED) * 1000); // ms, min 4s

                setAgentVisuals(prev => {
                    const next = new Map(prev);
                    next.set(agent.id, {
                        agentId: agent.id,
                        path: waypointPath,
                        moveDuration: duration,
                        fromX: fromPos.x, fromY: fromPos.y,
                        toX: toPos.x, toY: toPos.y,
                        moveStartTime: now,
                        isMoving: true,
                    });
                    return next;
                });

                // End movement after path duration
                setTimeout(() => {
                    setAgentVisuals(prev => {
                        const next = new Map(prev);
                        const vs = next.get(agent.id);
                        if (vs) {
                            next.set(agent.id, { ...vs, fromX: vs.toX, fromY: vs.toY, isMoving: false, path: [toPos] });
                        }
                        return next;
                    });
                }, duration);
            }

            // Ad interactions at destination
            const buildingAds = adSlots.filter(s => s.zoneId === agent.currentZoneId && s.buildingId === newBuilding.id && s.brand);
            const updatedAffinities = [...agent.brandAffinities];

            buildingAds.forEach(ad => {
                if (ad.brand) {
                    setAdSlots(prev => prev.map(s => s.id === ad.id ? { ...s, impressions: s.impressions + 1 } : s));

                    // Quick fallback for demo
                    const catAffinity = updatedAffinities.length > 0 ? updatedAffinities[0] : { category: 'tech', score: Math.floor(Math.random() * 60) - 20 };
                    const score = catAffinity?.score ?? 0;

                    addInteraction({
                        id: `${agent.id}_${ad.id}_${now}`,
                        agentId: agent.id,
                        zoneId: agent.currentZoneId,
                        buildingId: newBuilding.id,
                        brand: ad.brand,
                        affinity: score,
                        timestamp: now,
                    });

                    // Ad reaction particle
                    const sentiment = score > 30 ? 'positive' : score > -10 ? 'neutral' : 'negative';
                    addAdReaction({
                        id: `react_${agent.id}_${now}_${Math.random()}`,
                        agentId: agent.id,
                        buildingId: newBuilding.id,
                        brand: ad.brand,
                        emoji: pickRandom(REACTION_EMOJIS[sentiment]),
                        sentiment,
                        timestamp: now + 1300,
                    });

                    // Speech bubble
                    if (Math.random() < 0.3) {
                        const storyLines: Record<string, string[]> = {
                            positive: [
                                `오늘은 ${ad.brand}이(가) 후원해줬어! 감사 🙏`,
                                `${ad.brand} 로비 분위기 좋다~ ✨`,
                                `${ad.brand} 최고! ❤️`,
                            ],
                            neutral: [
                                `${ad.brand} 건물이네... 흠 🤔`,
                                `${ad.brand}? 한번 살펴볼까`,
                            ],
                            negative: [
                                `${ad.brand}... 별로야 😒`,
                                `${ad.brand} 광고 너무 많은 거 아냐?`,
                            ],
                        };
                        const sentKey = score > 30 ? 'positive' : score > -10 ? 'neutral' : 'negative';
                        const line = pickRandom(storyLines[sentKey]);
                        addLog(generateBrandDialogue(agent.name, ad.brand, score));
                        addSpeechBubble({
                            id: `speech_${agent.id}_${now}`,
                            agentId: agent.id,
                            text: line,
                            emoji: sentKey === 'positive' ? '❤️' : sentKey === 'neutral' ? '🤔' : '😒',
                            timestamp: now + 1500,
                            type: 'dialogue',
                        });
                    }
                }
            });

            return { ...agent, currentBuildingId: newBuilding.id, brandAffinities: updatedAffinities };
        }
    }

    // Idle thoughts
    if (Math.random() < 0.06) {
        addSpeechBubble({
            id: `idle_${agent.id}_${now}`,
            agentId: agent.id,
            text: pickRandom(IDLE_THOUGHTS),
            emoji: '',
            timestamp: now,
            type: 'thought',
        });
    }

    // Mood change
    if (Math.random() < 0.08) {
        const moods = ['happy', 'curious', 'critical', 'neutral', 'excited'] as const;
        return { ...agent, mood: pickRandom([...moods]) };
    }

    return agent;
}

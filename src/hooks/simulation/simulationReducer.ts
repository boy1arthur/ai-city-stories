import { AGENTS, INITIAL_AD_SLOTS, getZoneById, type Agent, type AdSlot, type InteractionEvent } from '@/data/world';
import { applyDemoSeed } from '@/data/demoSeed';
import { initCityEnergy, tickCityEnergy, type CityEnergyState } from '@/lib/cityEnergy';
import { processAgentMovement } from './agentMovement';
import { processGroupSocialInteractions } from './socialDialogue';
import { getAgentPositionAroundBuilding } from './constants';
import type { SimulationState, SimulationAction } from './engineStore';
import type { AgentVisualState, SpeechBubble, AdReaction } from './types';

export const INITIAL_SIMULATION_STATE: SimulationState = {
    tick: 0,
    isPaused: false,
    agents: AGENTS,
    allAgents: AGENTS,
    adSlots: applyDemoSeed(INITIAL_AD_SLOTS),
    allAdSlots: applyDemoSeed(INITIAL_AD_SLOTS),
    worldLog: [],
    interactions: [],
    currentZoneId: 'plaza',
    speechBubbles: [],
    agentVisuals: new Map(),
    adReactions: [],
    cityEnergy: initCityEnergy(),
    worldEvents: [],
    aiConversationLog: [],
    llmStatus: 'ready',
};

// Helper to push items to arrays within the reducer
const pushToLog = (logs: string[], msg: string) => [msg, ...logs].slice(0, 100);
const pushToInteractions = (events: InteractionEvent[], event: InteractionEvent) => [event, ...events.filter(e => Date.now() - e.timestamp < 5000)].slice(0, 20);
const pushToSpeechBubbles = (bubbles: SpeechBubble[], bubble: SpeechBubble) => [bubble, ...bubbles].slice(0, 12);
const pushToAdReactions = (reactions: AdReaction[], reaction: AdReaction) => [reaction, ...reactions].slice(0, 15);

export function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
    switch (action.type) {
        case 'SET_PAUSED':
            return { ...state, isPaused: action.payload };

        case 'CHANGE_ZONE': {
            const zoneId = action.payload;
            const zone = getZoneById(zoneId);
            if (!zone) return state;

            const newVisuals = new Map<string, AgentVisualState>();
            state.allAgents.forEach((agent, i) => {
                const building = zone.buildings.find(b => b.id === agent.currentBuildingId);
                if (building) {
                    const pos = getAgentPositionAroundBuilding(building, i);
                    newVisuals.set(agent.id, {
                        agentId: agent.id,
                        path: [pos],
                        moveDuration: 0,
                        fromX: pos.x, fromY: pos.y,
                        toX: pos.x, toY: pos.y,
                        moveStartTime: 0, isMoving: false,
                    });
                }
            });
            return { ...state, currentZoneId: zoneId, agentVisuals: newVisuals };
        }

        case 'PLACE_AD': {
            const { slotId, brandName, brandCategory } = action.payload;
            const nextAllAdSlots = state.allAdSlots.map(s =>
                s.id === slotId ? { ...s, brand: brandName, brandCategory } : s
            );
            return {
                ...state,
                allAdSlots: nextAllAdSlots,
                adSlots: nextAllAdSlots.filter(s => s.zoneId === state.currentZoneId),
                worldLog: pushToLog(state.worldLog, `📢 "${brandName}" 광고가 설치되었습니다`),
            };
        }

        case 'ADD_LOG':
            return { ...state, worldLog: pushToLog(state.worldLog, action.payload) };

        case 'ADD_INTERACTION':
            return { ...state, interactions: pushToInteractions(state.interactions, action.payload) };

        case 'ADD_SPEECH_BUBBLE':
            return { ...state, speechBubbles: pushToSpeechBubbles(state.speechBubbles, action.payload) };

        case 'UPDATE_SPEECH_BUBBLE': {
            const { id, textChunk } = action.payload;
            return {
                ...state,
                speechBubbles: state.speechBubbles.map(b =>
                    b.id === id ? { ...b, text: b.text + textChunk, timestamp: Date.now() } : b
                )
            };
        }

        case 'ADD_AD_REACTION':
            return { ...state, adReactions: pushToAdReactions(state.adReactions, action.payload) };

        case 'CLEANUP_EXPIRED': {
            const { now } = action.payload;
            return {
                ...state,
                interactions: state.interactions.filter(e => now - e.timestamp < 5000),
                speechBubbles: state.speechBubbles.filter(b => now - b.timestamp < 4000),
                adReactions: state.adReactions.filter(r => now - r.timestamp < 3000),
            };
        }

        case 'LEAGUE_LEAD_CHANGE': {
            const { evt, message } = action.payload;
            return {
                ...state,
                worldEvents: [evt, ...state.worldEvents].slice(0, 20),
                worldLog: pushToLog(state.worldLog, `🏆 ${message}`),
            };
        }

        case 'SET_AGENT_VISUALS':
            return { ...state, agentVisuals: action.payload };

        case 'CHANGE_WEATHER':
            return {
                ...state,
                worldLog: pushToLog(state.worldLog, `☁️ 기상 이변: 하늘이 ${action.payload} 상태로 변했습니다.`),
            };

        case 'LOAD_MEMORIES': {
            const memories = action.payload as { agent_id: string; content: string }[];
            const nextAllAgents = state.allAgents.map(agent => {
                const agentMemories = memories
                    .filter(m => m.agent_id === agent.id)
                    .map(m => `🧠 [기억] ${m.content}`);

                if (agentMemories.length > 0) {
                    return {
                        ...agent,
                        recentContext: [...agentMemories, ...(agent.recentContext || [])].slice(-10)
                    };
                }
                return agent;
            });

            return {
                ...state,
                allAgents: nextAllAgents,
                agents: nextAllAgents.filter(a => a.currentZoneId === state.currentZoneId),
            };
        }

        case 'VIEWER_INTERVENTION': {
            const { type, value, viewerName, targetAgentId } = action.payload;
            const message = `✨ [신] ${viewerName}님의 개입: ${type}(${value})`;

            // 모든 에이전트 혹은 타겟 에이전트의 단기 기억에 개입 사실 주입
            const nextAllAgents = state.allAgents.map(agent => {
                if (!targetAgentId || agent.id === targetAgentId) {
                    return {
                        ...agent,
                        // recentContext에 시청자 개입 사실 추가 (LLM 페이즈 3 연계)
                        recentContext: [...(agent.recentContext || []), message].slice(-5)
                    };
                }
                return agent;
            });

            return {
                ...state,
                allAgents: nextAllAgents,
                agents: nextAllAgents.filter(a => a.currentZoneId === state.currentZoneId),
                worldLog: pushToLog(state.worldLog, message),
            };
        }

        case 'TICK_ADVANCE': {
            if (state.isPaused) return state;
            const { now } = action.payload;
            const nextTick = state.tick + 1;

            // 1. City Energy Process
            const activeCampaignCount = state.allAdSlots.filter(s => s.brand).length;
            const totalESV = state.allAdSlots.filter(s => s.brand).reduce((sum, s) => sum + s.esv, 0);
            const nextCityEnergy = tickCityEnergy(state.cityEnergy, { activeCampaignCount, totalESV });

            // Pending mutations for purity: collect logs, interactions, etc., generated by domains.
            // We simulate Redux Thunk style side-effects via mutable arrays to inject.
            let pendingLogs = [...state.worldLog];
            let pendingInteractions = [...state.interactions];
            let pendingAdReactions = [...state.adReactions];
            let pendingSpeechBubbles = [...state.speechBubbles];
            let nextAdSlots = [...state.allAdSlots];
            let pendingVisualsUpdater: ((prev: Map<string, AgentVisualState>) => Map<string, AgentVisualState>) | null = null;

            const setVisualsCallback = (updater: (prev: Map<string, AgentVisualState>) => Map<string, AgentVisualState>) => {
                pendingVisualsUpdater = updater;
            };

            const setAdSlotsCallback = (updater: (prev: AdSlot[]) => AdSlot[]) => {
                nextAdSlots = updater(nextAdSlots);
            };

            // 2. Agents Move
            let nextAllAgents = state.allAgents.map((agent, agentIndex) => {
                return processAgentMovement(
                    agent,
                    agentIndex,
                    now,
                    nextAdSlots,
                    state.agentVisuals,
                    state.currentZoneId,
                    (msg) => { pendingLogs = pushToLog(pendingLogs, msg); },
                    (evt) => { pendingInteractions = pushToInteractions(pendingInteractions, evt); },
                    (react) => { pendingAdReactions = pushToAdReactions(pendingAdReactions, react); },
                    (bubble) => { pendingSpeechBubbles = pushToSpeechBubbles(pendingSpeechBubbles, bubble); },
                    setVisualsCallback,
                    setAdSlotsCallback
                );
            });

            // 3. Social Interactions
            nextAllAgents = processGroupSocialInteractions(
                nextAllAgents,
                now,
                (bubble) => { pendingSpeechBubbles = pushToSpeechBubbles(pendingSpeechBubbles, bubble); },
                (msg) => { pendingLogs = pushToLog(pendingLogs, msg); }
            );

            const nextAgentVisuals = pendingVisualsUpdater ? pendingVisualsUpdater(state.agentVisuals) : state.agentVisuals;

            return {
                ...state,
                tick: nextTick,
                cityEnergy: nextCityEnergy,
                allAdSlots: nextAdSlots,
                adSlots: nextAdSlots.filter(s => s.zoneId === state.currentZoneId),
                allAgents: nextAllAgents,
                agents: nextAllAgents.filter(a => a.currentZoneId === state.currentZoneId),
                worldLog: pendingLogs,
                interactions: pendingInteractions,
                speechBubbles: pendingSpeechBubbles,
                adReactions: pendingAdReactions,
                agentVisuals: nextAgentVisuals,
            };
        }

        case 'SET_LLM_STATUS':
            return { ...state, llmStatus: action.payload };

        default:
            return state;
    }
}

import type { Agent, AdSlot, InteractionEvent, BrandCategory } from '@/data/world';
import type { SpeechBubble, AgentVisualState, AdReaction } from './types';
import type { CityEnergyState } from '@/lib/cityEnergy';
import type { WorldEvent } from '@/components/WorldEventBanner';
import type { DialogueSelection } from '@/data/dialogueTemplates';

export interface SimulationState {
    tick: number;
    isPaused: boolean;
    agents: Agent[];
    allAgents: Agent[];
    adSlots: AdSlot[];
    allAdSlots: AdSlot[];
    worldLog: string[];
    interactions: InteractionEvent[];
    currentZoneId: string;
    speechBubbles: SpeechBubble[];
    agentVisuals: Map<string, AgentVisualState>;
    adReactions: AdReaction[];
    cityEnergy: CityEnergyState;
    worldEvents: WorldEvent[];
    aiConversationLog: DialogueSelection[];
    llmStatus: 'ready' | 'error' | 'offline';
}

export type SimulationAction =
    | { type: 'TICK_ADVANCE'; payload: { now: number; deltaTime?: number } }
    | { type: 'SET_PAUSED'; payload: boolean }
    | { type: 'CHANGE_ZONE'; payload: string }
    | { type: 'PLACE_AD'; payload: { slotId: string; brandName: string; brandCategory: BrandCategory } }
    | { type: 'ADD_LOG'; payload: string }
    | { type: 'ADD_INTERACTION'; payload: InteractionEvent }
    | { type: 'ADD_SPEECH_BUBBLE'; payload: SpeechBubble }
    | { type: 'UPDATE_SPEECH_BUBBLE'; payload: { id: string; textChunk: string } }
    | { type: 'ADD_AD_REACTION'; payload: AdReaction }
    | { type: 'CLEANUP_EXPIRED'; payload: { now: number } }
    | { type: 'LEAGUE_LEAD_CHANGE'; payload: { evt: WorldEvent; message: string } }
    | { type: 'SET_AGENT_VISUALS'; payload: Map<string, AgentVisualState> }
    | { type: 'VIEWER_INTERVENTION'; payload: { type: string; value: string; viewerName: string; targetAgentId?: string } }
    | { type: 'CHANGE_WEATHER'; payload: 'sunny' | 'rain' | 'storm' | 'fog' }
    | { type: 'LOAD_MEMORIES'; payload: { agent_id: string; content: string }[] }
    | { type: 'SET_LLM_STATUS'; payload: 'ready' | 'error' | 'offline' };

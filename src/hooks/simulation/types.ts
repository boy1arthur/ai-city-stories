export interface SpeechBubble {
    id: string;
    agentId: string;
    text: string;
    emoji: string;
    timestamp: number;
    type: 'dialogue' | 'reaction' | 'thought';
}

export interface AgentVisualState {
    agentId: string;
    path: import('@/lib/pathfinding').Waypoint[];
    moveStartTime: number;
    moveDuration: number;
    isMoving: boolean;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

export interface AdReaction {
    id: string;
    agentId: string;
    buildingId: string;
    brand: string;
    emoji: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    timestamp: number;
}

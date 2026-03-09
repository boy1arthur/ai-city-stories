import { pickRandom } from '@/lib/utils';
import type { Agent } from '@/data/world';
import { SOCIAL_DIALOGUES } from './constants';
import type { SpeechBubble } from './types';

function generateSocialDialogue(agent1: Agent, agent2: Agent): { topic: string; line1: string; line2: string } | null {
    const topicGroup = pickRandom(SOCIAL_DIALOGUES);
    const [line1, line2] = pickRandom(topicGroup.lines) as [string, string];
    return { topic: topicGroup.topic, line1, line2 };
}

export function processSocialInteractions(
    currentAgents: Agent[],
    now: number,
    addSpeechBubble: (bubble: SpeechBubble) => void,
    addLog: (msg: string) => void
): Agent[] {
    const agentsByBuilding = new Map<string, Agent[]>();
    currentAgents.forEach(a => {
        const key = `${a.currentZoneId}_${a.currentBuildingId}`;
        const list = agentsByBuilding.get(key) || [];
        list.push(a);
        agentsByBuilding.set(key, list);
    });

    return currentAgents.map(originalAgent => {
        let updatedAgent = { ...originalAgent };

        // Find the group this agent belongs to to execute logic per group
        // In our pure functional map approach, it's slightly harder to mutate randomly, 
        // but we can apply logic deterministically if we process groups beforehand.
        return updatedAgent;
    });
}

// A better pure approach for the social interaction block that mutates the whole array
export function processGroupSocialInteractions(
    currentAgents: Agent[],
    now: number,
    addSpeechBubble: (bubble: SpeechBubble) => void,
    addLog: (msg: string) => void
): Agent[] {
    const agentsByBuilding = new Map<string, Agent[]>();
    currentAgents.forEach(a => {
        const key = `${a.currentZoneId}_${a.currentBuildingId}`;
        const list = agentsByBuilding.get(key) || [];
        list.push(a);
        agentsByBuilding.set(key, list);
    });

    const nextAgents = [...currentAgents];

    agentsByBuilding.forEach((group) => {
        if (group.length < 2) return;
        if (Math.random() > 0.15) return;

        const a1 = pickRandom(group);
        const others = group.filter(a => a.id !== a1.id);
        if (others.length === 0) return;
        const a2 = pickRandom(others);

        const dialogue = generateSocialDialogue(a1, a2);
        if (!dialogue) return;

        // Agent 1 speaks first
        addSpeechBubble({
            id: `social_${a1.id}_${now}_${Math.random().toString(36).slice(2, 6)}`,
            agentId: a1.id,
            text: dialogue.line1,
            emoji: dialogue.topic === 'brand_chat' ? '💬' : dialogue.topic === 'gossip' ? '🗣️' : dialogue.topic === 'deep' ? '💭' : '👋',
            timestamp: now,
            type: 'dialogue',
        });

        // Agent 2 responds after a short delay
        addSpeechBubble({
            id: `social_${a2.id}_${now}_${Math.random().toString(36).slice(2, 6)}`,
            agentId: a2.id,
            text: dialogue.line2,
            emoji: dialogue.topic === 'brand_chat' ? '💬' : '😄',
            timestamp: now + 1500,
            type: 'dialogue',
        });

        addLog(`💬 ${a1.avatar} ${a1.name} ↔ ${a2.avatar} ${a2.name}: "${dialogue.line1}" / "${dialogue.line2}"`);

        // Social interactions can shift mood
        if (Math.random() < 0.3) {
            const happyMoods: Agent['mood'][] = ['happy', 'excited'];
            for (let i = 0; i < nextAgents.length; i++) {
                if (nextAgents[i].id === a1.id || nextAgents[i].id === a2.id) {
                    nextAgents[i] = { ...nextAgents[i], mood: pickRandom(happyMoods) };
                }
            }
        }
    });

    return nextAgents;
}

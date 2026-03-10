import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { simulationReducer, INITIAL_SIMULATION_STATE } from './simulationReducer';
import type { SimulationState } from './engineStore';

describe('simulationReducer with Fake Timers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should advance tick when TICK_ADVANCE is dispatched', () => {
        const action = { type: 'TICK_ADVANCE' as const, payload: { now: Date.now() } };
        const newState = simulationReducer(INITIAL_SIMULATION_STATE, action);

        expect(newState.tick).toBe(INITIAL_SIMULATION_STATE.tick + 1);
    });

    it('should ignore TICK_ADVANCE if paused', () => {
        const pausedState: SimulationState = { ...INITIAL_SIMULATION_STATE, isPaused: true };
        const action = { type: 'TICK_ADVANCE' as const, payload: { now: Date.now() } };
        const newState = simulationReducer(pausedState, action);

        expect(newState.tick).toBe(pausedState.tick);
    });

    it('should track logic arrays correctly after TICK_ADVANCE', () => {
        const action = { type: 'TICK_ADVANCE' as const, payload: { now: Date.now() } };
        const newState = simulationReducer(INITIAL_SIMULATION_STATE, action);

        // Assert purity and immutable references
        expect(newState).not.toBe(INITIAL_SIMULATION_STATE);
        expect(newState.agents).toBeDefined();
        expect(newState.worldLog).toBeDefined();
    });

    it('should place an ad correctly', () => {
        const action = { type: 'PLACE_AD' as const, payload: { slotId: 'test-slot-1', brandName: 'TestBrand' } };

        const testState: SimulationState = {
            ...INITIAL_SIMULATION_STATE,
            allAdSlots: [{ id: 'test-slot-1', zoneId: 'plaza', buildingId: 'b1', type: 'billboard', brand: null, impressions: 0, esv: 10, capacity: 1, priority: 'standard' }],
            currentZoneId: 'plaza',
        };

        const newState = simulationReducer(testState, action);

        expect(newState.allAdSlots[0].brand).toBe('TestBrand');
        expect(newState.worldLog[0]).toContain('TestBrand');
    });

    it('should cleanup expired events', () => {
        const now = Date.now();
        const staleState = {
            ...INITIAL_SIMULATION_STATE,
            interactions: [{ timestamp: now - 10000, id: '1', agentId: 'a1', zoneId: 'z1', buildingId: 'b1', brand: 'B1', affinity: 10 }],
            speechBubbles: [{ timestamp: now - 10000, id: '1', agentId: 'a1', text: 'hi', emoji: '', type: 'dialogue' as const }],
        };

        const action = { type: 'CLEANUP_EXPIRED' as const, payload: { now } };
        const newState = simulationReducer(staleState, action);

        expect(newState.interactions.length).toBe(0);
        expect(newState.speechBubbles.length).toBe(0);
    });
});

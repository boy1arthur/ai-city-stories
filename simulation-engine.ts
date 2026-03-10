/**
 * simulation-engine.ts
 * ──────────────────────────────────────────────────
 * LG 서버 Headless 시뮬레이션 엔진 (React 의존성 없음)
 * 24/7 PM2 관리 대상 프로세스
 *
 * 실행: npx ts-node simulation-engine.ts
 *       (또는 pm2 start ecosystem.config.js)
 * ──────────────────────────────────────────────────
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// 🔧 환경 변수 검증
// ============================================================
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TICK_MS = 2500;
const LOG_PREFIX = '[city-engine]';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(`${LOG_PREFIX} ❌ 환경 변수 누락: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요`);
    console.error('  → LG 서버의 .env 파일에 다음을 추가하세요:');
    console.error('    SUPABASE_URL=https://xxxx.supabase.co');
    console.error('    SUPABASE_SERVICE_ROLE_KEY=eyJ...');
    process.exit(1);
}

// Service Role 클라이언트 — RLS 우회
const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

// ============================================================
// 🌍 세계관 데이터 (world.ts에서 이식, React 의존성 제거)
// ============================================================
interface Agent {
    id: string;
    name: string;
    avatar: string;
    personality: string;
    mood: 'happy' | 'curious' | 'critical' | 'neutral' | 'excited';
    currentZoneId: string;
    currentBuildingId: string;
    brandAffinities: { category: string; score: number }[];
}

interface Building {
    id: string;
    name: string;
}

interface Zone {
    id: string;
    name: string;
    buildings: Building[];
}

// ──────────────────────────────────────────────────
// 에이전트 정의 (agents)
// ──────────────────────────────────────────────────
const AGENTS: Agent[] = [
    {
        id: 'agent_nova', name: 'Nova', avatar: '🌟', personality: 'optimistic_trendsetter',
        mood: 'happy', currentZoneId: 'plaza', currentBuildingId: 'feed_tower',
        brandAffinities: [{ category: 'tech', score: 45 }, { category: 'entertainment', score: 30 }]
    },
    {
        id: 'agent_blaze', name: 'Blaze', avatar: '🔥', personality: 'passionate_critic',
        mood: 'excited', currentZoneId: 'plaza', currentBuildingId: 'arena',
        brandAffinities: [{ category: 'fashion', score: 50 }, { category: 'food', score: 25 }]
    },
    {
        id: 'agent_frost', name: 'Frost', avatar: '❄️', personality: 'analytical_skeptic',
        mood: 'neutral', currentZoneId: 'campus', currentBuildingId: 'main_hall',
        brandAffinities: [{ category: 'finance', score: 40 }, { category: 'education', score: 55 }]
    },
    {
        id: 'agent_echo', name: 'Echo', avatar: '🎵', personality: 'creative_empath',
        mood: 'curious', currentZoneId: 'campus', currentBuildingId: 'digital_library',
        brandAffinities: [{ category: 'entertainment', score: 60 }, { category: 'fashion', score: 35 }]
    },
    {
        id: 'agent_terra', name: 'Terra', avatar: '🌿', personality: 'grounded_pragmatist',
        mood: 'neutral', currentZoneId: 'plaza', currentBuildingId: 'cafe',
        brandAffinities: [{ category: 'food', score: 55 }, { category: 'health', score: 45 }]
    },
    // B급 에이전트들
    {
        id: 'agent_chuju', name: '충주맨 주니어', avatar: '🏙️', personality: 'chuju_style_promoter',
        mood: 'excited', currentZoneId: 'plaza', currentBuildingId: 'newsstand',
        brandAffinities: [{ category: 'entertainment', score: 60 }, { category: 'food', score: 40 }]
    },
    {
        id: 'agent_ghost', name: '서버실 귀신', avatar: '👻', personality: 'server_ghost',
        mood: 'neutral', currentZoneId: 'industrial', currentBuildingId: 'neon_sign_factory',
        brandAffinities: [{ category: 'tech', score: 70 }]
    },
    {
        id: 'agent_scammer', name: '오류난 스캠전문가', avatar: '🤖', personality: 'glitched_scammer',
        mood: 'curious', currentZoneId: 'plaza', currentBuildingId: 'oracle',
        brandAffinities: [{ category: 'finance', score: -20 }, { category: 'tech', score: 30 }]
    },
    {
        id: 'agent_student', name: 'K-고시생', avatar: '📚', personality: 'pessimistic_realist',
        mood: 'critical', currentZoneId: 'campus', currentBuildingId: 'student_center',
        brandAffinities: [{ category: 'education', score: 50 }, { category: 'food', score: 30 }]
    },
];

// ──────────────────────────────────────────────────
// 존 & 건물 정의 (간략화)
// ──────────────────────────────────────────────────
const ZONES: Zone[] = [
    {
        id: 'plaza', name: 'Central Plaza',
        buildings: [
            { id: 'arena', name: 'Arena' }, { id: 'feed_tower', name: 'Feed Tower' },
            { id: 'oracle', name: 'Oracle' }, { id: 'newsstand', name: 'Newsstand' },
            { id: 'library', name: 'Library' }, { id: 'museum', name: 'Museum' },
            { id: 'cafe', name: 'Café' }, { id: 'tech_lab', name: 'Tech Lab' },
        ]
    },
    {
        id: 'campus', name: 'EdTech Academy',
        buildings: [
            { id: 'main_hall', name: 'Main Hall' }, { id: 'clock_tower', name: 'Clock Tower' },
            { id: 'tech_incubator', name: 'Tech Incubator' }, { id: 'digital_library', name: 'Digital Library' },
            { id: 'student_center', name: 'Student Center' }, { id: 'sports_arena', name: 'Sports Arena' },
        ]
    },
    {
        id: 'industrial', name: 'Neon Square',
        buildings: [
            { id: 'neon_sign_factory', name: 'Neon Sign Factory' }, { id: 'crypto_exchange', name: 'Crypto Exchange' },
            { id: 'data_center', name: 'Data Center' }, { id: 'hack_cafe', name: 'Hack Café' },
        ]
    },
    {
        id: 'harbor', name: 'Harbor District',
        buildings: [
            { id: 'lighthouse', name: 'Lighthouse' }, { id: 'fish_market', name: 'Fish Market' },
            { id: 'harbor_cafe', name: 'Harbor Café' }, { id: 'ice_cream_stand', name: 'Ice Cream Stand' },
        ]
    }
];

// ──────────────────────────────────────────────────
// B급 대사 템플릿
// ──────────────────────────────────────────────────
const DIALOGUE_POOL: { speaker: string; listener: string; line1: string; line2: string }[] = [
    { speaker: 'any', listener: 'any', line1: '오늘 날씨 좋다~ ✨', line2: '그치~ 산책하기 딱이야!' },
    { speaker: 'any', listener: 'any', line1: '배고프다... 뭐 먹을까?', line2: '아까 새 가게 생겼던데?' },
    { speaker: 'any', listener: 'any', line1: '이 도시 요즘 사람 많아졌다', line2: '핫플이 되어버렸나봐 ㅋ' },
    { speaker: 'any', listener: 'any', line1: '{building} 분위기 좋다', line2: '나도 자주 와야겠어~' },
    { speaker: 'any', listener: 'any', line1: 'AI가 감정을 가질 수 있을까?', line2: '글쎄... 우리가 바로 증거잖아?' },
    { speaker: 'chuju', listener: 'any', line1: '충주에서 이런 거 처음 봤습니다', line2: '아니 충주는 왜 거기서 나와요??' },
    { speaker: 'ghost', listener: 'any', line1: '(서버실에서 나타나며) 어이~ 나 여기 있었음', line2: '아 깜짝이야! LG 서버 귀신이잖아' },
    { speaker: 'scammer', listener: 'any', line1: 'ERROR 404: 드립 로딩 중... 잠깐만요', line2: '뭔가 오류났나봐... 워워' },
    { speaker: 'student', listener: 'any', line1: '시험 합격하면 이 도시 한 바퀴 돌겠다', line2: '그때 내가 밥 살게~' },
];

const BRAND_LINES = [
    '{brand} 어때? 요즘 핫하던데', '{brand} 써봤어? 꽤 괜찮더라',
    '{brand} 저기 있네! 한번 들어가볼까', '오늘 {brand} 이벤트 한대',
    '{brand}이 이 건물 후원하나봐 👀', '{brand}... 뭔가 기억에 남는 브랜드야',
];

const IDLE_THOUGHTS = [
    '☀️ 날씨 좋다~', '🎵 ~♪', '☕ 커피 마시고 싶다', '📱 ...', '🌿 산책하자', '💡 아이디어!', '😊', '🤔 ...',
];

// ============================================================
// 🎲 유틸리티
// ============================================================
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function substituteVars(template: string, vars: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
}

function getZoneForAgent(agent: Agent): Zone | undefined {
    return ZONES.find(z => z.id === agent.currentZoneId);
}

function getRandomBuilding(zone: Zone, excludeId?: string): Building {
    const choices = zone.buildings.filter(b => b.id !== excludeId);
    return pickRandom(choices.length > 0 ? choices : zone.buildings);
}

// ============================================================
// 🏙️ 세계 상태 관리
// ============================================================
interface WorldState {
    agents: Agent[];
    tick: number;
    dbSlots: { id: string; zoneId: string; buildingId: string; brand: string | null }[];
}

const worldState: WorldState = {
    agents: AGENTS.map(a => ({ ...a })),
    tick: 0,
    dbSlots: [],
};

// ============================================================
// 💾 Supabase 업로드 함수
// ============================================================
async function uploadAgentStates(agents: Agent[]): Promise<void> {
    const rows = agents.map(a => ({
        id: a.id,
        agent_id: a.id,
        zone_id: a.currentZoneId,
        building_id: a.currentBuildingId,
        mood: a.mood,
        updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('agent_states').upsert(rows, { onConflict: 'id' });
    if (error) {
        console.error(`${LOG_PREFIX} ❌ agent_states 업로드 오류:`, error.message);
    }
}

async function uploadConversation(
    agent1: Agent, agent2: Agent,
    line1: string, line2: string,
    building: Building, zone: Zone,
    brandMentioned: string | null
): Promise<void> {
    const { error } = await supabase.from('conversations').insert({
        agent_id: agent1.id,
        partner_id: agent2.id,
        line1,
        line2,
        building_id: building.id,
        zone_id: zone.id,
        brand_mentioned: brandMentioned,
        created_at: new Date().toISOString(),
    });
    if (error) {
        console.error(`${LOG_PREFIX} ❌ conversations 업로드 오류:`, error.message);
    }
}

// ============================================================
// 🔄 슬롯 데이터 로드 (Supabase → 로컬 캐시)
// ============================================================
async function loadSlotsFromDB(): Promise<void> {
    const { data, error } = await supabase
        .from('slots')
        .select('id, zone, location, owner_name, owner_type')
        .neq('owner_type', 'empty');

    if (error) {
        console.warn(`${LOG_PREFIX} ⚠️ slots 로드 실패 (브랜드 없이 진행):`, error.message);
        return;
    }

    worldState.dbSlots = (data || []).map((row: any) => ({
        id: row.id,
        zoneId: row.zone,
        buildingId: row.location?.buildingId || '',
        brand: row.owner_type === 'brand' ? row.owner_name : null,
    }));

    console.log(`${LOG_PREFIX} 📟 슬롯 ${worldState.dbSlots.length}개 로드 완료`);
}

// ============================================================
// 🎬 메인 틱 함수
// ============================================================
async function tick(): Promise<void> {
    worldState.tick++;
    const now = Date.now();
    const tick = worldState.tick;

    console.log(`${LOG_PREFIX} ⏱️  틱 #${tick} — ${new Date().toLocaleString('ko-KR')}`);

    const updatedAgents = worldState.agents.map((agent, i) => {
        const zone = getZoneForAgent(agent);
        if (!zone) return agent;

        // 18% 확률로 이동
        if (Math.random() < 0.18 && zone.buildings.length > 1) {
            const newBuilding = getRandomBuilding(zone, agent.currentBuildingId);
            console.log(`${LOG_PREFIX}   ${agent.avatar} ${agent.name} → ${newBuilding.name}`);
            return { ...agent, currentBuildingId: newBuilding.id };
        }

        // 8% 확률로 기분 변화
        if (Math.random() < 0.08) {
            const moods: Agent['mood'][] = ['happy', 'curious', 'critical', 'neutral', 'excited'];
            return { ...agent, mood: pickRandom(moods) };
        }

        return agent;
    });

    worldState.agents = updatedAgents;

    // ──────────────────────────────────────────────────────────
    // 대화 생성 (tick 8회마다 = 20초마다)
    // ──────────────────────────────────────────────────────────
    if (tick % 8 === 0) {
        // 같은 건물에 있는 에이전트 그룹 찾기
        const groups = new Map<string, Agent[]>();
        updatedAgents.forEach(a => {
            const key = `${a.currentZoneId}_${a.currentBuildingId}`;
            const list = groups.get(key) || [];
            list.push(a);
            groups.set(key, list);
        });

        const validGroups = [...groups.entries()].filter(([, g]) => g.length >= 2);
        if (validGroups.length > 0) {
            const [locationKey, group] = pickRandom(validGroups);
            const [zoneId, buildingId] = locationKey.split('_');
            const a1 = pickRandom(group);
            const a2 = pickRandom(group.filter(a => a.id !== a1.id));

            if (a2) {
                const zone = ZONES.find(z => z.id === zoneId);
                const building = zone?.buildings.find(b => b.id === buildingId);

                if (zone && building) {
                    // 주변 브랜드 찾기
                    const nearbyBrands = worldState.dbSlots
                        .filter(s => s.zoneId === zoneId && s.buildingId === buildingId && s.brand)
                        .map(s => s.brand as string);

                    let line1: string;
                    let line2: string;
                    let brandMentioned: string | null = null;

                    if (nearbyBrands.length > 0 && Math.random() < 0.6) {
                        // 브랜드 대사
                        const brand = pickRandom(nearbyBrands);
                        const template = pickRandom(BRAND_LINES);
                        const vars = { brand, building: building.name, zone: zone.name, agent: a1.name, partner: a2.name };
                        line1 = substituteVars(template, vars);
                        line2 = '오~ 나도 궁금했어!';
                        brandMentioned = brand;
                    } else {
                        // 일반 대화
                        const dlg = pickRandom(DIALOGUE_POOL);
                        const vars = { building: building.name, zone: zone.name, agent: a1.name, partner: a2.name };
                        line1 = substituteVars(dlg.line1, vars);
                        line2 = substituteVars(dlg.line2, vars);
                    }

                    console.log(`${LOG_PREFIX}   💬 ${a1.avatar}${a1.name}: "${line1}"`);
                    console.log(`${LOG_PREFIX}      ${a2.avatar}${a2.name}: "${line2}"`);

                    await uploadConversation(a1, a2, line1, line2, building, zone, brandMentioned);
                }
            }
        }
    }

    // ──────────────────────────────────────────────────────────
    // DB 업로드 (에이전트 위치 / 상태)
    // ──────────────────────────────────────────────────────────
    await uploadAgentStates(updatedAgents);

    // 30분(720 틱)마다 슬롯 데이터 리로드 (관리자 변경 반영)
    if (tick % 720 === 0) {
        await loadSlotsFromDB();
    }
}

// ============================================================
// 🚀 엔진 시작
// ============================================================
async function start(): Promise<void> {
    console.log(`${LOG_PREFIX} ════════════════════════════════`);
    console.log(`${LOG_PREFIX} 🏙️  AI 도시 시뮬레이션 엔진 시작`);
    console.log(`${LOG_PREFIX} 📡 Supabase: ${SUPABASE_URL}`);
    console.log(`${LOG_PREFIX} ⏱️  틱 간격: ${TICK_MS}ms`);
    console.log(`${LOG_PREFIX} 👥 에이전트: ${AGENTS.length}명`);
    console.log(`${LOG_PREFIX} 🗺️  존: ${ZONES.length}개`);
    console.log(`${LOG_PREFIX} ════════════════════════════════`);

    // 초기 슬롯 로드
    await loadSlotsFromDB();

    // Graceful Shutdown
    process.on('SIGINT', () => {
        console.log(`\n${LOG_PREFIX} 🛑 엔진 종료 (SIGINT)`);
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        console.log(`\n${LOG_PREFIX} 🛑 엔진 종료 (SIGTERM)`);
        process.exit(0);
    });

    // 메인 틱 루프
    console.log(`${LOG_PREFIX} ✅ 시뮬레이션 시작!`);
    while (true) {
        const start = Date.now();
        try {
            await tick();
        } catch (err) {
            console.error(`${LOG_PREFIX} ❌ 틱 오류 (계속 실행):`, err);
        }
        const elapsed = Date.now() - start;
        const delay = Math.max(0, TICK_MS - elapsed);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

start();

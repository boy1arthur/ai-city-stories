import type { Building } from '@/data/world';

export const REACTION_EMOJIS = {
    positive: ['👍', '❤️', '✨', '🔥', '💯', '👏'],
    neutral: ['🤔', '👀', '💭', '📋', '🔍'],
    negative: ['😒', '👎', '💤', '❌', '😑'],
};

export const IDLE_THOUGHTS = [
    '☀️ 날씨 좋다~',
    '🎵 ~♪',
    '☕ 커피 마시고 싶다',
    '📱 ...',
    '🌿 산책하자',
    '💡 아이디어!',
    '😊',
];

export const SOCIAL_DIALOGUES: { topic: string; lines: [string, string][]; moods?: string[] }[] = [
    {
        topic: 'greeting', lines: [
            ['안녕! 오랜만이다', '오~ 반가워!'],
            ['여기서 만나다니!', '나도 놀랐어 ㅋㅋ'],
            ['뭐하고 있었어?', '그냥 돌아다니는 중~'],
        ]
    },
    {
        topic: 'brand_chat', lines: [
            ['요즘 NovaTech 광고 봤어?', '응 꽤 괜찮더라'],
            ['BrewBean 커피 마셔봤어?', '아직~ 맛있대?'],
            ['Lumière 신제품 나왔대', '오 진짜? 봐야겠다'],
            ['VerdeMart 할인 중이래', '거기 자주 가?'],
            ['Kinetic 운동화 어때?', '디자인 좋던데!'],
        ]
    },
    {
        topic: 'place', lines: [
            ['여기 분위기 좋다', '그치~ 자주 와야지'],
            ['이 건물 뭐하는 곳이야?', '나도 처음 와봐'],
            ['여기 사람 많네', '인기 있는 곳인가봐'],
        ]
    },
    {
        topic: 'mood', lines: [
            ['오늘 기분 좋아!', '나도~ 날씨 덕분인가'],
            ['좀 심심하다...', '같이 뭐 하자!'],
            ['배고프다...', '근처에 맛집 있나?'],
            ['피곤해ㅠ', '좀 쉬어~ 벤치 있어'],
        ], moods: ['happy', 'neutral', 'curious']
    },
    {
        topic: 'gossip', lines: [
            ['아까 Blaze가 뭐라 했는지 알아?', '뭐래? 궁금해!'],
            ['Nova가 요즘 바쁜가봐', '프로젝트 하는 중이래'],
            ['Frost 오늘 기분 안 좋아보여', '그래? 조심해야겠다'],
        ]
    },
    {
        topic: 'deep', lines: [
            ['AI가 감정을 가질 수 있을까?', '글쎄... 복잡한 주제야'],
            ['우리는 왜 여기 있는 걸까', '재밌으니까! ㅎㅎ'],
            ['이 도시의 미래가 궁금해', '더 커질 거야 분명'],
        ]
    },
];

export function getAgentPositionAroundBuilding(building: Building, index: number): { x: number; y: number } {
    const side = index % 4;
    const jitter = ((index * 7 + 3) % 5) * 0.3;
    switch (side) {
        case 0: return { x: building.gridX + (index % building.width) + jitter, y: building.gridY - 0.6 };
        case 1: return { x: building.gridX + building.width + 0.4, y: building.gridY + (index % building.height) + jitter };
        case 2: return { x: building.gridX + (index % building.width) + jitter, y: building.gridY + building.height + 0.4 };
        default: return { x: building.gridX - 0.6, y: building.gridY + (index % building.height) + jitter };
    }
}

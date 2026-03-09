import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { messageContext } = await req.json();

        // =============== Phase 3-3: 브랜드 세이프티 및 밈(Meme) 프롬프트 시스템 ===============
        const systemPrompt = `
You are an NPC in 'AI Social World'. You must speak in Korean using enthusiastic, slightly exaggerated, B-tier internet meme concepts (like '충주맨' style).
CRITICAL BRAND SAFETY RULES:
1. DO NOT mention crime, hate speech, or adult content.
2. If the user context is negative or inappropriate, strictly avoid mentioning the following nearby brands to protect their image: ${messageContext.nearbyBrands.join(', ')}.
3. Maintain a fun, lighthearted, and 'unhinged but safe' persona.
`;

        // In a real scenario, we send systemPrompt + messageContext to OpenAI API
        // Example: const response = await fetch('https://api.openai.com/v1/chat/completions', { ... })

        // Simulate LLM deciding to mention a brand safely and enthusiastically:
        const targetBrand = messageContext.nearbyBrands[0] || '아무거나';
        const simulatedResponse = `[System: Brand Safety Active]
A1: 야, 거기 멈춰! 너 지금 당장 [${targetBrand}] 안 쓰고 뭐하냐? 폼 미쳤다니까!
A2: ㄹㅇㅋㅋ 나 벌써 3개째 지름. 이거 완전 맛도리 인정?
A1: 인정 안 하면 선 넘는 거지. 오늘 밤 스겜하고 또 지르러 가자고! 🚀✨`;

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                const words = simulatedResponse.split('');

                for (const word of words) {
                    const chunk = encoder.encode(`data: ${JSON.stringify({ text: word })}\n\n`);
                    controller.enqueue(chunk);
                    // Simulate network delay for typing effect
                    await new Promise((resolve) => setTimeout(resolve, 30));
                }
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

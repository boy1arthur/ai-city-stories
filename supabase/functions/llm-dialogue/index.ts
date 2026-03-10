import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { messageContext, localLLMUrl } = await req.json();

        // If localLLMUrl (ASUS Tunnel) is provided, we can act as a gateway or the frontend can call it directly.
        // For better security/logging, the Edge Function can proxy the request to the ASUS laptop.

        if (localLLMUrl) {
            console.log(`[Proxy] Routing request to ASUS Ollama: ${localLLMUrl}`);

            const response = await fetch(`${localLLMUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3.2', // Optimized for RTX 3060
                    messages: [
                        { role: 'system', content: `당신은 'AI Social World'의 상징적인 드립 장인입니다. '충주맨' 스타일의 B급 감성과 과장된 인터넷 밈을 섞어 대화하세요. 근처 브랜드: ${messageContext.nearbyBrands.join(', ')}` },
                        { role: 'user', content: `현재 장소: ${messageContext.buildingName}, 주변 브랜드들: ${messageContext.nearbyBrands.join(', ')}. 에이전트들의 성격과 상황에 맞는 찰진 대화를 생성해줘.` }
                    ],
                    stream: true,
                }),
            });

            return new Response(response.body, {
                headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
            });
        }

        // Fallback or Mock for local development without ASUS online
        const simulatedResponse = `[ASUS Offline Check]
A1: 야, 지금 ASUS 형님 노트북 꺼진 거 아냐? 대화 폼이 왜 이래?
A2: ㄹㅇㅋㅋ RTX 3060 빌드업 중이라 그래. 잠시만 기다려봐, 킹받는 드립 곧 터진다!`;

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const words = simulatedResponse.split('');
                for (const word of words) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word })}\n\n`));
                    await new Promise((r) => setTimeout(r, 20));
                }
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                controller.close();
            },
        });

        return new Response(stream, {
            headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

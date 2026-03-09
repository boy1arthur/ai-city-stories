import "jsr:@supabase/functions-js/edge-runtime.d.ts"

/**
 * Phase 4-2: 시청자 명령어 웹훅 엔드포인트
 * Twitch/YouTube 봇이 POST 요청으로 명령어를 전송하면,
 * Supabase DB에 저장 → 프론트엔드 Realtime 구독이 감지 → 도시에 적용
 *
 * 사용 예시 (트위치 봇에서):
 *   POST /functions/v1/viewer-command
 *   { "commandType": "WEATHER", "commandValue": "storm", "viewerName": "홍길동" }
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { createClient } = await import('npm:@supabase/supabase-js@2');
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const { commandType, commandValue, targetAgentId, viewerName, donationAmount } = await req.json();

        // Validation: command type whitelist
        const allowedTypes = ['WEATHER', 'SEND_ITEM', 'ANNOUNCE', 'BOOST_AGENT'];
        if (!allowedTypes.includes(commandType)) {
            return new Response(JSON.stringify({ error: '유효하지 않은 명령어입니다.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // Insert into viewer_commands table → triggers Realtime subscription on frontend
        const { data, error } = await supabase
            .from('viewer_commands')
            .insert({
                command_type: commandType,
                command_value: commandValue,
                target_agent_id: targetAgentId || null,
                viewer_name: viewerName || 'Anonymous',
                donation_amount: donationAmount || null,
            })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, command: data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '알 수 없는 오류';
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

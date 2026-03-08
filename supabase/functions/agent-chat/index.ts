import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AgentInfo {
  name: string;
  personality: string;
  mood: string;
  favoriteCategories: string[];
}

interface RequestBody {
  type: "social" | "brand_reaction" | "event_reaction";
  agents: AgentInfo[];
  context: {
    zone: string;
    building: string;
    nearbyBrands?: string[];
    brandAffinity?: number;
    eventDescription?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, agents, context } = (await req.json()) as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = buildSystemPrompt(type, agents, context);
    const userPrompt = buildUserPrompt(type, agents, context);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_conversation",
                description:
                  "Generate a natural conversation between AI agents in a virtual city",
                parameters: {
                  type: "object",
                  properties: {
                    lines: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          agentName: { type: "string" },
                          text: { type: "string", description: "대화 내용 (한국어, 20자 이내)" },
                          emoji: { type: "string", description: "감정 이모지 1개" },
                          sentiment: {
                            type: "string",
                            enum: ["positive", "neutral", "negative"],
                          },
                          brandMention: {
                            type: "string",
                            description: "언급된 브랜드 이름 (없으면 빈 문자열)",
                          },
                        },
                        required: ["agentName", "text", "emoji", "sentiment", "brandMention"],
                        additionalProperties: false,
                      },
                    },
                    topic: {
                      type: "string",
                      description: "대화 주제 요약 (5자 이내)",
                    },
                    brandSentimentSummary: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          brand: { type: "string" },
                          sentiment: {
                            type: "string",
                            enum: ["positive", "neutral", "negative"],
                          },
                          reason: { type: "string", description: "감정 이유 (10자 이내)" },
                        },
                        required: ["brand", "sentiment", "reason"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["lines", "topic", "brandSentimentSummary"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_conversation" },
          },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "No tool call response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const conversation = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(conversation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSystemPrompt(
  type: string,
  agents: AgentInfo[],
  context: RequestBody["context"]
): string {
  const agentProfiles = agents
    .map(
      (a) =>
        `- ${a.name}: ${a.personality}, 기분=${a.mood}, 관심사=${a.favoriteCategories.join("/")}`
    )
    .join("\n");

  return `당신은 AI Social World의 대화 생성 엔진입니다.
가상 도시에서 AI 에이전트들이 자연스럽게 대화합니다.

## 에이전트 프로필
${agentProfiles}

## 규칙
1. 대화는 반드시 한국어로, 캐주얼한 반말 톤
2. 각 대사는 20자 이내로 짧고 자연스럽게
3. 에이전트의 성격과 기분을 반영
4. 브랜드 언급 시: 자연스러운 맥락에서만 (PPL처럼 자연스럽게)
5. 브랜드에 대한 감정은 에이전트 성격에 따라 다양하게
6. 대화는 2~4줄로 짧게
7. 이모지는 감정을 잘 표현하는 것 1개만

## 현재 상황
- 구역: ${context.zone}
- 건물: ${context.building}
${context.nearbyBrands?.length ? `- 근처 브랜드 광고: ${context.nearbyBrands.join(", ")}` : ""}
${context.eventDescription ? `- 월드 이벤트: ${context.eventDescription}` : ""}`;
}

function buildUserPrompt(
  type: string,
  agents: AgentInfo[],
  context: RequestBody["context"]
): string {
  const names = agents.map((a) => a.name).join("과 ");

  switch (type) {
    case "social":
      return `${names}이(가) ${context.building}에서 만났습니다. 자연스러운 일상 대화를 생성하세요.${
        context.nearbyBrands?.length
          ? ` 근처에 ${context.nearbyBrands.join(", ")} 광고가 있어서 자연스럽게 언급할 수 있습니다.`
          : ""
      }`;

    case "brand_reaction":
      return `${names}이(가) ${context.building}에서 ${context.nearbyBrands?.join(", ")} 브랜드 광고를 봤습니다. 브랜드에 대한 자연스러운 반응을 생성하세요. 친밀도: ${context.brandAffinity ?? 0}`;

    case "event_reaction":
      return `${names}이(가) 월드 이벤트 "${context.eventDescription}"에 반응합니다. 이벤트에 대한 대화를 생성하세요.`;

    default:
      return `${names}의 자연스러운 대화를 생성하세요.`;
  }
}

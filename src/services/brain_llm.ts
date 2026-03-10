import { supabase } from '@/integrations/supabase/client';
import { DialogueMatchContext } from '../data/dialogueTemplates';

export interface LLMChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMStreamOptions {
    onChunk: (text: string) => void;
    onDone: () => void;
    onError: (error: any) => void;
}

/**
 * [Brain-LLM Module]
 * ASUS 노트북(Ollama)과 Supabase를 매끄럽게 연결하고,
 * 캐릭터 페르소나를 주입하는 핵심 로직을 담당합니다.
 */
export const brainLlmService = {
    /**
     * SSE 스트리밍을 통해 대화 데이터를 가져옵니다.
     * VITE_LLM_API_URL이 설정되어 있으면 ASUS(Local)를 우선 호출합니다.
     */
    async streamDialogue(matchCtx: DialogueMatchContext, options: LLMStreamOptions) {
        const { onChunk, onDone, onError } = options;
        const localLLMUrl = import.meta.env.VITE_LLM_API_URL;

        try {
            // 1. Edge Function 호출 (또는 Local Proxy 호출)
            const edgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llm-dialogue`;

            const response = await fetch(edgeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
                },
                body: JSON.stringify({
                    messageContext: matchCtx,
                    localLLMUrl: localLLMUrl // ASUS 오프라인 방지를 위해 터널 주소 전달
                }),
            });

            if (!response.ok) throw new Error('LLM 호출 실패');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('Stream reader를 생성할 수 없습니다.');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') {
                            onDone();
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) onChunk(parsed.text);
                            if (parsed.textChunk) onChunk(parsed.textChunk);
                            // Llama 3 format (Ollama proxy result might differ)
                            if (parsed.choices?.[0]?.delta?.content) {
                                onChunk(parsed.choices[0].delta.content);
                            }
                        } catch (e) {
                            console.warn('[BrainLLM] JSON Parse error:', e);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[BrainLLM] Stream Error:', err);
            onError(err);
        }
    }
};

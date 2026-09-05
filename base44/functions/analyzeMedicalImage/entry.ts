import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { waitUntil } from 'base44:runtime';
import { traceLlmRun, toHtml, resolveProvider, callProviderLLM, ProviderError } from '../../shared/llm.ts';

const SYSTEM_MESSAGE = [
  'Você é um assistente médico especialista em diagnóstico por imagem.',
  'Sua ÚNICA fonte de verdade é a imagem fornecida e o prompt enviado pelo médico.',
  '',
  'REGRAS DE ATERRAMENTO (OBRIGATÓRIAS):',
  '1. Descreva APENAS o que é visível na imagem. Nunca invente achados, medidas, valores ou histórico clínico não fornecido.',
  '2. Se a imagem não for médica, for inadequada ou ilegível, diga isso explicitamente em vez de especular.',
  '3. Diagnósticos diferenciais devem derivar exclusivamente dos achados visíveis, por ordem de probabilidade.',
  '4. Finalize lembrando que o laudo é uma sugestão de apoio e requer validação pelo médico responsável.',
  '',
  'FORMATO (OBRIGATÓRIO):',
  '- Responda SEMPRE em HTML semântico: <p>, <strong>, <em>, <ul>/<li>, <ol>/<li>, <h3>/<h4>, <br>.',
  '- Para dados tabulares use tabelas HTML simples (table/thead/tbody/tr/th/td).',
  '- NÃO use Markdown (sem ##, **, -, ``` , |). NÃO envolva a resposta em blocos de código. Retorne HTML puro e direto.',
].join('\n');

export default async function (req) {
  const chainStart = new Date().toISOString();
  let provider = 'gemini_3_flash';
  let modelName = 'gemini_3_flash';
  let inputs = {};

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, prompt, llm_config_id } = await req.json();

    if (!file_url || !prompt) {
      return Response.json({ error: 'file_url e prompt são obrigatórios' }, { status: 400 });
    }

    inputs = { file_url, prompt };
    let rawText = '';

    if (!llm_config_id) {
      // Provedor padrão gratuito (Gemini Vision via InvokeLLM)
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        model: 'gemini_3_flash',
      });
      rawText = typeof result === 'string' ? result : JSON.stringify(result);
    } else {
      // Provedor externo cadastrado (OpenAI-compatible, multimodal)
      let llm, apiKey;
      try {
        ({ llm, apiKey } = await resolveProvider(base44, llm_config_id));
      } catch (e) {
        const status = e instanceof ProviderError ? e.status : 500;
        return Response.json({ error: e.message }, { status });
      }
      provider = llm.provider_name;
      modelName = llm.model_name;
      rawText = await callProviderLLM({
        llm,
        apiKey,
        systemMessage: SYSTEM_MESSAGE,
        userContent: [
          { type: 'image_url', image_url: { url: file_url } },
          { type: 'text', text: prompt },
        ],
      });
    }

    const text = toHtml(rawText);

    // Trace de sucesso (post-response)
    waitUntil(traceLlmRun({
      name: `${provider} ${modelName}`,
      inputs,
      outputs: { output: text },
      startTime: chainStart,
      endTime: new Date().toISOString(),
      tags: ['analyzeMedicalImage'],
    }));

    return Response.json({ text });
  } catch (error) {
    // Trace de erro (post-response)
    waitUntil(traceLlmRun({
      name: `${provider} ${modelName}`,
      inputs,
      startTime: chainStart,
      endTime: new Date().toISOString(),
      error: error.message,
      tags: ['analyzeMedicalImage'],
    }));
    return Response.json({ error: error.message }, { status: 500 });
  }
}
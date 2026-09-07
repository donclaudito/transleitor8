import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { waitUntil } from 'base44:runtime';
import { traceLlmRun, toHtml, resolveProvider, callProviderLLM, logLLMUsage, ProviderError } from '../../shared/llm.ts';

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
  const startMs = Date.now();
  let provider = '';
  let modelName = '';
  let inputs = {};
  let base44 = null;

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, image_data_url, prompt, llm_config_id } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'prompt é obrigatório' }, { status: 400 });
    }

    // Imagem enviada pelo app como data URL (base64) ou como URL pública.
    const imageUrl = image_data_url || file_url;
    if (!imageUrl) {
      return Response.json({ error: 'Envie uma imagem para análise' }, { status: 400 });
    }

    inputs = { image: image_data_url ? '(imagem anexada em base64)' : file_url, prompt };

    // Roteamento exclusivo pelos provedores cadastrados em LLMConfig (chaves nos
    // segredos do app): o selecionado no seletor ou, sem seleção, o primeiro
    // provedor de visão ativo — sem uso de integrações da plataforma.
    let llm, apiKey;
    try {
      if (llm_config_id) {
        ({ llm, apiKey } = await resolveProvider(base44, llm_config_id));
        if (!llm.supports_image) {
          throw new ProviderError('Este provedor não suporta análise de imagem. Selecione um modelo com visão.', 400);
        }
      } else {
        const visionProviders = await base44.asServiceRole.entities.LLMConfig.filter(
          { is_active: true, supports_image: true }
        );
        if (!visionProviders.length) {
          throw new ProviderError('Nenhum provedor de análise de imagem ativo. Cadastre um modelo com suporte a imagem ou selecione um no seletor.', 400);
        }
        visionProviders.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        llm = visionProviders[0];
        apiKey = Deno.env.get(llm.api_key_env_var);
        if (!apiKey) {
          throw new ProviderError(`Chave API não configurada: ${llm.api_key_env_var}`, 500);
        }
      }
    } catch (e) {
      const status = e instanceof ProviderError ? e.status : 500;
      waitUntil(logLLMUsage(base44, {
        flow: 'imagem', provider, model: modelName,
        responseTimeMs: Date.now() - startMs, status: 'erro',
      }));
      return Response.json({ error: e.message }, { status });
    }

    provider = llm.provider_name;
    modelName = llm.model_name;

    const { text: rawText, tokens } = await callProviderLLM({
      llm,
      apiKey,
      systemMessage: SYSTEM_MESSAGE,
      userContent: [
        { type: 'image_url', image_url: { url: imageUrl } },
        { type: 'text', text: prompt },
      ],
    });

    const text = toHtml(rawText);

    // Monitoramento de uso (tokens/tempo) — o id retorna ao frontend para a nota de precisão
    const usageLogId = await logLLMUsage(base44, {
      flow: 'imagem', provider, model: modelName, tokens,
      responseTimeMs: Date.now() - startMs,
    });

    // Trace de sucesso (post-response)
    waitUntil(traceLlmRun({
      name: `${provider} ${modelName}`,
      inputs,
      outputs: { output: text },
      startTime: chainStart,
      endTime: new Date().toISOString(),
      tags: ['analyzeMedicalImage'],
    }));

    return Response.json({ text, usage_log_id: usageLogId });
  } catch (error) {
    if (base44) {
      waitUntil(logLLMUsage(base44, {
        flow: 'imagem', provider, model: modelName,
        responseTimeMs: Date.now() - startMs, status: 'erro',
      }));
    }
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
import { marked } from 'npm:marked@15.0.12';
import { secrets } from 'base44:runtime';

const LANGSMITH_BASE = 'https://api.smith.langchain.com/runs';
const LANGSMITH_PROJECT = 'transleitor';

export class ProviderError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

// Envia um trace de execução de LLM ao LangSmith (post-response, nunca bloqueia/quebra a geração).
export async function traceLlmRun({ name, inputs, outputs, startTime, endTime, error, tags = [] }) {
  const apiKey = secrets.get('LANGSMITH_API_KEY');
  if (!apiKey) return; // tracing desativado se a chave não estiver configurada
  const runId = crypto.randomUUID();
  const headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };
  try {
    await fetch(LANGSMITH_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: runId,
        name,
        run_type: 'llm',
        inputs,
        start_time: startTime,
        session_name: LANGSMITH_PROJECT,
        tags,
      }),
    });
    await fetch(`${LANGSMITH_BASE}/${runId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        outputs: error ? undefined : outputs,
        end_time: endTime,
        ...(error ? { error } : {}),
      }),
    });
  } catch (_) {
    // tracing é best-effort: falhas de rede/API do LangSmith nunca afetam a geração
  }
}

// Converte Markdown para HTML se a resposta não contiver tags HTML
export function toHtml(rawText) {
  const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(rawText);
  return hasHtmlTags ? rawText : marked.parse(rawText);
}

// Garante que a URL termine com /chat/completions
export function ensureChatCompletionsUrl(apiUrl) {
  return apiUrl.endsWith('/chat/completions')
    ? apiUrl
    : apiUrl.replace(/\/+$/, '') + '/chat/completions';
}

// Busca a configuração do provedor externo e sua chave API (armazenada como variável de ambiente).
export async function resolveProvider(base44, llmConfigId) {
  const config = await base44.asServiceRole.entities.LLMConfig.filter({ id: llmConfigId });
  if (!config || config.length === 0) {
    throw new ProviderError('Configuração de LLM não encontrada', 404);
  }
  const llm = config[0];
  if (!llm.is_active) {
    throw new ProviderError('Este provedor está desativado', 400);
  }
  const apiKey = Deno.env.get(llm.api_key_env_var);
  if (!apiKey) {
    throw new ProviderError(`Chave API não configurada: ${llm.api_key_env_var}`, 500);
  }
  return { llm, apiKey };
}

// Chamada genérica a APIs externas OpenAI-compatible (texto puro ou multimodal com image_url).
export async function callProviderLLM({ llm, apiKey, systemMessage, userContent, temperature = 0.1 }) {
  const response = await fetch(ensureChatCompletionsUrl(llm.api_url), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: llm.model_name,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userContent },
      ],
      temperature,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new ProviderError(`Erro na API do provedor (${response.status}): ${errText}`, 502);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || data.response || data.content || data.text || '';
  if (!rawText) {
    throw new ProviderError('Resposta da API em formato inesperado', 502);
  }
  const tokens = data.usage?.total_tokens ?? null;
  return { text: rawText, tokens };
}

// Registra o uso de LLM na entidade LLMUsageLog (best-effort: falhas nunca afetam a geração).
export async function logLLMUsage(base44, { flow, provider, model, tokens = null, responseTimeMs, status = 'sucesso' }) {
  try {
    const record = await base44.entities.LLMUsageLog.create({
      flow,
      provider,
      model,
      tokens,
      response_time_ms: responseTimeMs,
      status,
    });
    return record?.id || null;
  } catch (_) {
    return null;
  }
}
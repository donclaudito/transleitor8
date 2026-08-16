import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { marked } from 'npm:marked@15.0.12';
import { secrets, waitUntil } from 'base44:runtime';

const LANGSMITH_BASE = 'https://api.smith.langchain.com/runs';
const LANGSMITH_PROJECT = 'transleitor';

// Envia um trace de execução de LLM ao LangSmith (post-response, nunca bloqueia/quebra a geração).
async function traceLlmRun({ name, inputs, outputs, startTime, endTime, error }) {
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
        tags: ['generateSOAP'],
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

Deno.serve(async (req) => {
  const chainStart = new Date().toISOString();
  let provider = 'gemini_3_flash';
  let modelName = 'gemini_3_flash';
  let promptText = '';

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, llm_config_id } = await req.json();

    if (!prompt) return Response.json({ error: 'Prompt é obrigatório' }, { status: 400 });

    promptText = prompt;
    let rawText = '';

    // Se não foi especificado um provedor externo, usa o InvokeLLM padrão
    if (!llm_config_id) {
      rawText = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'gemini_3_flash',
      });
    } else {
      // Busca a configuração do provedor
      const config = await base44.asServiceRole.entities.LLMConfig.filter({ id: llm_config_id });
      if (!config || config.length === 0) {
        return Response.json({ error: 'Configuração de LLM não encontrada' }, { status: 404 });
      }

      const llm = config[0];
      if (!llm.is_active) {
        return Response.json({ error: 'Este provedor está desativado' }, { status: 400 });
      }

      const apiKey = Deno.env.get(llm.api_key_env_var);
      if (!apiKey) {
        return Response.json({ error: `Chave API não configurada: ${llm.api_key_env_var}` }, { status: 500 });
      }

      provider = llm.provider_name;
      modelName = llm.model_name;

      // Garante que a URL termine com /chat/completions
      let apiUrl = llm.api_url;
      if (!apiUrl.endsWith('/chat/completions')) {
        apiUrl = apiUrl.replace(/\/+$/, '') + '/chat/completions';
      }

      // Chamada genérica à API externa (formato OpenAI-compatible)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: llm.model_name,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return Response.json({ error: `Erro na API do provedor (${response.status}): ${errText}` }, { status: 502 });
      }

      const data = await response.json();

      // Extrai o texto da resposta (formato OpenAI-compatible)
      rawText = data.choices?.[0]?.message?.content || data.response || data.content || data.text || '';
      if (!rawText) {
        return Response.json({ error: 'Resposta da API em formato inesperado', raw: data }, { status: 502 });
      }
    }

    // Converte Markdown para HTML se a resposta não contiver tags HTML
    const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(rawText);
    const text = hasHtmlTags ? rawText : marked.parse(rawText);

    // Trace de sucesso (post-response)
    waitUntil(traceLlmRun({
      name: `${provider} ${modelName}`,
      inputs: { prompt: promptText },
      outputs: { output: text },
      startTime: chainStart,
      endTime: new Date().toISOString(),
    }));

    return Response.json({ text });
  } catch (error) {
    // Trace de erro (post-response)
    waitUntil(traceLlmRun({
      name: `${provider} ${modelName}`,
      inputs: { prompt: promptText },
      startTime: chainStart,
      endTime: new Date().toISOString(),
      error: error.message,
    }));
    return Response.json({ error: error.message }, { status: 500 });
  }
});
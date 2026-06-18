import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, llm_config_id } = await req.json();

    if (!prompt) return Response.json({ error: 'Prompt é obrigatório' }, { status: 400 });

    // Se não foi especificado um provedor externo, usa o InvokeLLM padrão
    if (!llm_config_id) {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'gemini_3_flash',
      });
      return Response.json({ text: result });
    }

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

    // Chamada genérica à API externa (formato OpenAI-compatible)
    const response = await fetch(llm.api_url, {
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
    const text = data.choices?.[0]?.message?.content || data.response || data.content || data.text || '';
    if (!text) {
      return Response.json({ error: 'Resposta da API em formato inesperado', raw: data }, { status: 502 });
    }

    return Response.json({ text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
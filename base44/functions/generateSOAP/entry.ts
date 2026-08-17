import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { marked } from 'npm:marked@15.0.12';
import { secrets, waitUntil } from 'base44:runtime';
import { decryptApiKey } from "../../shared/crypto.ts";

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

      let apiKey = '';
      if (llm.api_key_encrypted) {
        apiKey = await decryptApiKey(llm.api_key_encrypted);
      } else if (llm.api_key_env_var) {
        apiKey = Deno.env.get(llm.api_key_env_var) || '';
      }
      if (!apiKey) {
        return Response.json({ error: 'Chave API do provedor não configurada (reinforme a chave no painel de Provedores de IA)' }, { status: 500 });
      }

      provider = llm.provider_name;
      modelName = llm.model_name;

      // Garante que a URL termine com /chat/completions
      let apiUrl = llm.api_url;
      if (!apiUrl.endsWith('/chat/completions')) {
        apiUrl = apiUrl.replace(/\/+$/, '') + '/chat/completions';
      }

      const systemMessage = [
        'Você é um assistente médico de documentação clínica brasileira.',
        'Sua ÚNICA fonte de verdade são os dados explicitamente fornecidos na mensagem do usuário (o formulário preenchido pelo médico).',
        '',
        'REGRAS DE ATERRAMENTO (OBRIGATÓRIAS):',
        '1. Use APENAS os dados presentes na mensagem do usuário. Nunca invente, complete, infira ou adicione informações que não foram fornecidas.',
        '2. Se um campo estiver vazio, ausente, com "—" ou "não informado", NÃO crie conteúdo para ele. DEIXE O CAMPO VAZIO ou omita a seção — NUNCA escreva "Não informado".',
        '3. É PROIBIDO inventar: valores de exames, medicamentos, posologias, sinais vitais, achados de exame físico, CID-10 não justificado, datas, nomes de procedimentos ou condutas não descritas.',
        '4. O CID-10 sugerido deve derivar EXCLUSIVAMENTE do quadro descrito. Se não houver dados suficientes, escreva "CID-10: dados insuficientes".',
        '5. Siga EXATAMENTE a estrutura e a ordem de seções definidas no prompt do usuário. Use os títulos exatos solicitados (ex: no modo Livre: Hipótese(s) Diagnóstica(s), CID-10 sugerido, HPP / Comorbidades, Uso de Medicação Contínua, Alergias, Exames Complementares, Prescrição Atual, Conduta, Plano Terapêutico). NÃO adicione, remova, renomeie nem reordene seções.',
        '6. Cada seção deve conter apenas dados efetivamente fornecidos; seção sem dado deve ficar VAZIA ou ser omitida — nunca inventada e nunca preenchida com "Não informado".',
        '7. Não use conhecimento geral para completar o raciocínio clínico além do input. Você organiza e formata — não diagnostica além do fornecido.',
        '',
        'Documentação médica legal: alucinar dados causa dano ao paciente. Na dúvida, deixe o campo vazio ou omita a seção.',
      ].join('\n');

      // Chamada genérica à API externa (formato OpenAI-compatible)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: llm.model_name,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
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
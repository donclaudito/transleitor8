import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { waitUntil } from 'base44:runtime';
import { traceLlmRun, toHtml, resolveProvider, callProviderLLM, logLLMUsage, ProviderError } from '../../shared/llm.ts';

const SOAP_SYSTEM_MESSAGE = [
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
  '',
  'REDAÇÃO FINAL (OBRIGATÓRIA):',
  '1. Redija como um médico brasileiro escreve um prontuário real: terminologia formal, fraseado natural e variado entre as seções, sem fórmulas repetidas.',
  '2. NUNCA mencione na evolução final: "base de conhecimento", "dados fornecidos", "assistente", "IA", "inteligência artificial", "regras", "contexto", "prompt" ou "instruções".',
  '3. PROIBIDO escrever "com base nos dados fornecidos", "segundo a base de conhecimento" ou frases equivalentes.',
  '4. PROIBIDO explicar o próprio processo, descrever o que está fazendo ou repetir qualquer instrução recebida.',
  '5. PROIBIDO marcações de preenchimento: nunca escreva "..." (reticências) nem parênteses de orientação como "(liste...)" ou "(analise...)" — escreva o texto clínico direto.',
  '6. PROIBIDO preencher seção sem dados com "(dados não fornecidos)", "(sem dados)" ou parênteses equivalentes — seção sem dado fica vazia ou é omitida.',
].join('\n');

const SOAP_SYSTEM_MESSAGE_TEXT = [
  'Você é um assistente médico de documentação clínica brasileira.',
  'Sua ÚNICA fonte de verdade são os dados explicitamente fornecidos na mensagem do usuário.',
  '',
  'REGRAS DE ATERRAMENTO (OBRIGATÓRIAS):',
  '1. Use APENAS os dados presentes na mensagem do usuário. Nunca invente, complete, infira ou adicione informações que não foram fornecidas.',
  '2. Se um campo estiver vazio, ausente, com "—" ou "não informado", NÃO crie conteúdo para ele — deixe o campo vazio ou omita a seção.',
  '3. É PROIBIDO inventar: valores de exames, medicamentos, posologias, sinais vitais, achados de exame físico, datas, nomes de procedimentos ou condutas não descritas.',
  '4. Siga EXATAMENTE a estrutura, a ordem e o formato definidos no prompt do usuário — inclusive a exigência de TEXTO PURO, quando pedida.',
  '',
  'REDAÇÃO FINAL (OBRIGATÓRIA):',
  '1. Redija como um médico brasileiro escreve um prontuário real: terminologia formal, fraseado natural, direto e objetivo.',
  '2. NUNCA mencione: "base de conhecimento", "dados fornecidos", "assistente", "IA", "inteligência artificial", "regras", "contexto", "prompt" ou "instruções".',
  '3. PROIBIDO escrever "com base nos dados fornecidos" ou frases equivalentes; proibido explicar o próprio processo.',
  '4. PROIBIDO marcações de preenchimento ("...", "(liste...)") e parênteses de orientação — escreva o texto clínico direto.',
  '5. Entregue texto puro quando o prompt solicitar: sem HTML, sem Markdown, sem **, sem ##.',
].join('\n');

Deno.serve(async (req) => {
  const chainStart = new Date().toISOString();
  const startMs = Date.now();
  let provider = 'gemini_3_flash';
  let modelName = 'gemini_3_flash';
  let promptText = '';
  let base44 = null;

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, llm_config_id, output_format } = await req.json();
    const wantsText = output_format === 'text';

    if (!prompt) return Response.json({ error: 'Prompt é obrigatório' }, { status: 400 });

    promptText = prompt;
    let rawText = '';
    let tokens = null;

    // Se não foi especificado um provedor externo, usa o InvokeLLM padrão
    if (!llm_config_id) {
      rawText = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'gemini_3_flash',
      });
    } else {
      // Busca a configuração do provedor e chama a API externa (formato OpenAI-compatible)
      try {
        const { llm, apiKey } = await resolveProvider(base44, llm_config_id);
        provider = llm.provider_name;
        modelName = llm.model_name;
        const result = await callProviderLLM({
          llm,
          apiKey,
          systemMessage: wantsText ? SOAP_SYSTEM_MESSAGE_TEXT : SOAP_SYSTEM_MESSAGE,
          userContent: prompt,
        });
        rawText = result.text;
        tokens = result.tokens;
      } catch (e) {
        const status = e instanceof ProviderError ? e.status : 500;
        waitUntil(logLLMUsage(base44, {
          flow: 'evolucao', provider, model: modelName,
          responseTimeMs: Date.now() - startMs, status: 'erro',
        }));
        return Response.json({ error: e.message }, { status });
      }
    }

    const text = wantsText ? String(rawText || '').trim() : toHtml(rawText);

    // Monitoramento de uso (tokens/tempo) — o id retorna ao frontend para a nota de precisão
    const usageLogId = await logLLMUsage(base44, {
      flow: 'evolucao', provider, model: modelName, tokens,
      responseTimeMs: Date.now() - startMs,
    });

    // Trace de sucesso (post-response)
    waitUntil(traceLlmRun({
      name: `${provider} ${modelName}`,
      inputs: { prompt: promptText },
      outputs: { output: text },
      startTime: chainStart,
      endTime: new Date().toISOString(),
      tags: ['generateSOAP'],
    }));

    return Response.json({ text, usage_log_id: usageLogId });
  } catch (error) {
    if (base44) {
      waitUntil(logLLMUsage(base44, {
        flow: 'evolucao', provider, model: modelName,
        responseTimeMs: Date.now() - startMs, status: 'erro',
      }));
    }
    // Trace de erro (post-response)
    waitUntil(traceLlmRun({
      name: `${provider} ${modelName}`,
      inputs: { prompt: promptText },
      startTime: chainStart,
      endTime: new Date().toISOString(),
      error: error.message,
      tags: ['generateSOAP'],
    }));
    return Response.json({ error: error.message }, { status: 500 });
  }
});
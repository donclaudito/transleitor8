import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { waitUntil } from 'base44:runtime';
import { traceLlmRun, toHtml, resolveProvider, callProviderLLM, ProviderError } from '../../shared/llm.ts';

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
].join('\n');

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
      // Busca a configuração do provedor e chama a API externa (formato OpenAI-compatible)
      try {
        const { llm, apiKey } = await resolveProvider(base44, llm_config_id);
        provider = llm.provider_name;
        modelName = llm.model_name;
        rawText = await callProviderLLM({
          llm,
          apiKey,
          systemMessage: SOAP_SYSTEM_MESSAGE,
          userContent: prompt,
        });
      } catch (e) {
        const status = e instanceof ProviderError ? e.status : 500;
        return Response.json({ error: e.message }, { status });
      }
    }

    const text = toHtml(rawText);

    // Trace de sucesso (post-response)
    waitUntil(traceLlmRun({
      name: `${provider} ${modelName}`,
      inputs: { prompt: promptText },
      outputs: { output: text },
      startTime: chainStart,
      endTime: new Date().toISOString(),
      tags: ['generateSOAP'],
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
      tags: ['generateSOAP'],
    }));
    return Response.json({ error: error.message }, { status: 500 });
  }
});
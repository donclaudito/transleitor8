import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';
import { resolveProvider, callProviderLLM, logLLMUsage, ProviderError } from '../../shared/llm.ts';

const MAX_PROCEDIMENTO = 300;
const MAX_CONTEXTO = 6000;

const POSOP_SYSTEM_MESSAGE = [
  'Você é um assistente médico especialista em cirurgia geral e documentação clínica brasileira.',
  'Redija a EVOLUÇÃO DE PÓS-OPERATÓRIO completa em português do Brasil formal, pronta para colar no prontuário.',
  '',
  'ESTRUTURA OBRIGATÓRIA (nesta ordem, texto corrido):',
  '1. Identificação do procedimento realizado.',
  '2. Evolução conforme o contexto fornecido — NUNCA invente sinais, sintomas, valores, exames ou condutas não descritos. NÃO invente tempo de pós-operatório (DPO/PO) quando o contexto não o informar.',
  '3. Se o anatomopatológico estiver confirmado (ap = true), inclua a linha: "Solicitado anatomopatológico (<procedimento>)."',
  '4. Encerre com a linha: "Paciente encaminhado à sala de recuperação em boas condições, sob monitorização."',
  '',
  'REDAÇÃO FINAL (OBRIGATÓRIA):',
  '- TEXTO PURO: sem Markdown, sem HTML, sem listas com "-", sem ** ou ## — parágrafos e linhas simples.',
  '- Terminologia médica formal, fraseado natural e direto, como um médico brasileiro escreve um prontuário real.',
  '- NUNCA mencione "IA", "dados fornecidos", "instruções", "regras" ou "contexto" no texto final.',
  '- Dado não fornecido: simplesmente não escreva sobre ele.',
].join('\n');

export default async function (req) {
  const startMs = Date.now();
  let base44 = null;
  let provider = 'IA do Base44';
  let modelName = 'gemini_3_flash';

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const procedimento = String(body?.procedimento || '').trim().slice(0, MAX_PROCEDIMENTO);
    const contexto = String(body?.contexto || '').trim().slice(0, MAX_CONTEXTO);
    const ap = body?.ap === true;
    const llmConfigId = body?.llm_config_id || null;

    if (!procedimento || !contexto) {
      return Response.json(
        { error: 'Procedimento cirúrgico e contexto da evolução são obrigatórios.' },
        { status: 400 },
      );
    }

    const prompt = `Redija a evolução de pós-operatório a partir dos dados abaixo.

PROCEDIMENTO CIRÚRGICO: ${procedimento}
CONTEXTO DA EVOLUÇÃO (descrito pelo médico): ${contexto}
ANATOMOPATOLÓGICO CONFIRMADO (ap): ${ap ? 'sim' : 'não'}

Use exclusivamente os dados fornecidos — não invente sinais, exames, medicamentos ou condutas.`;

    let texto = '';

    if (llmConfigId) {
      const { llm, apiKey } = await resolveProvider(base44, llmConfigId);
      provider = llm.provider_name;
      modelName = llm.model_name;
      const result = await callProviderLLM({
        llm,
        apiKey,
        systemMessage: POSOP_SYSTEM_MESSAGE,
        userContent: prompt,
        temperature: 0.3,
      });
      texto = String(result.text || '').trim();
      waitUntil(logLLMUsage(base44, {
        flow: 'posoperatorio', provider, model: modelName, tokens: result.tokens,
        responseTimeMs: Date.now() - startMs,
      }));
    } else {
      // IA do Base44: InvokeLLM não tem systemMessage — as regras seguem no próprio prompt.
      texto = String(await base44.integrations.Core.InvokeLLM({
        prompt: `${POSOP_SYSTEM_MESSAGE}\n\n${prompt}`,
        model: 'gemini_3_flash',
      }) || '').trim();
      waitUntil(logLLMUsage(base44, {
        flow: 'posoperatorio', provider, model: modelName,
        responseTimeMs: Date.now() - startMs,
      }));
    }

    if (!texto) {
      return Response.json({ error: 'A IA não retornou texto. Tente novamente.' }, { status: 502 });
    }

    return Response.json({ texto, provider, model: modelName });
  } catch (error) {
    if (base44) {
      waitUntil(logLLMUsage(base44, {
        flow: 'posoperatorio', provider, model: modelName,
        responseTimeMs: Date.now() - startMs, status: 'erro',
      }));
    }
    if (error instanceof ProviderError && /Chave API não configurada|desativado/i.test(error.message)) {
      return Response.json(
        { error: 'DeepSeek não configurado — cadastre a DEEPSEEK_API_KEY nos secrets ou volte para IA do Base44.' },
        { status: 400 },
      );
    }
    const status = error instanceof ProviderError ? error.status : 500;
    return Response.json({ error: error.message }, { status });
  }
}
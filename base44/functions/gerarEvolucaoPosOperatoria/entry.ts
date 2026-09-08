import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';
import { resolveProvider, callProviderLLM, logLLMUsage, ProviderError } from '../../shared/llm.ts';

const MAX_PROCEDIMENTO = 300;
const MAX_EVOLUCAO = 6000;

const POSOP_SYSTEM_MESSAGE = [
  'Você é um assistente médico especialista em cirurgia geral e documentação clínica brasileira.',
  'Gere uma nota de pós-operatório em TEXTO PURO (sem HTML, sem Markdown), técnica e pronta para prontuário.',
  '',
  'REGRAS DE ATERRAMENTO (OBRIGATÓRIAS):',
  '1. Use APENAS os dados fornecidos na mensagem do usuário. Nunca invente exames, sinais vitais, medicamentos, achados ou condutas.',
  '2. Dado não fornecido = linha omitida. Nunca escreva "não informado" ou equivalentes.',
  '',
  'REDAÇÃO FINAL (OBRIGATÓRIA):',
  '1. Redija como um médico brasileiro escreve um prontuário real: terminologia médica formal, fraseado natural e direto.',
  '2. NUNCA mencione "IA", "dados fornecidos", "instruções", "regras" ou "contexto" no texto final.',
  '3. Entregue TEXTO PURO: sem HTML, sem Markdown, sem **, sem ##, sem listas com "-" — parágrafos e linhas simples.',
].join('\n');

export default async function (req) {
  const startMs = Date.now();
  let base44 = null;
  let provider = 'gemini_3_flash';
  let modelName = 'gemini_3_flash';

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const procedimento = String(body?.procedimento || '').trim().slice(0, MAX_PROCEDIMENTO);
    const evolucao = String(body?.evolucao || '').trim().slice(0, MAX_EVOLUCAO);
    const encaminhado = body?.encaminhado === true;
    const apConfirmado = body?.ap_confirmado === true;
    const apPendente = body?.ap_confirmado == null;
    const llmConfigId = body?.llm_config_id || null;

    if (!procedimento || !evolucao) {
      return Response.json(
        { error: 'Procedimento cirúrgico e evolução de pós-operatório são obrigatórios.' },
        { status: 400 },
      );
    }

    const apTexto = apConfirmado ? 'confirmado' : apPendente ? 'pendente de confirmação' : 'não confirmado';
    const prompt = `Gere a nota de pós-operatório a partir dos dados abaixo.

DADOS DO CASO:
- Procedimento cirúrgico: ${procedimento}
- Evolução de pós-operatório descrita pelo médico: ${evolucao}
- Encaminhamento à sala de recuperação pós-anestésica: ${encaminhado ? 'sim' : 'não'}
- Confirmação de anatomopatológico (AP): ${apTexto}

ESTRUTURA OBRIGATÓRIA (nesta ordem, texto corrido):
1. Procedimento realizado (linha inicial identificando o procedimento).
2. Evolução de pós-operatório (quadro atual redigido de forma técnica, a partir da descrição do médico).
3. Encaminhamento à sala de recuperação pós-anestésica — inclua a linha APENAS quando indicado como "sim".
4. Linha de anatomopatológico — inclua APENAS quando o AP estiver confirmado (ex.: "Anatomopatológico confirmado."). Quando pendente ou não confirmado, omita a linha.

Use exclusivamente os dados fornecidos.`;

    let text = '';
    let fonte = 'IA do Base44';

    if (llmConfigId) {
      const { llm, apiKey } = await resolveProvider(base44, llmConfigId);
      provider = llm.provider_name;
      modelName = llm.model_name;
      const result = await callProviderLLM({
        llm,
        apiKey,
        systemMessage: POSOP_SYSTEM_MESSAGE,
        userContent: prompt,
      });
      text = String(result.text || '').trim();
      fonte = llm.provider_name;
      waitUntil(logLLMUsage(base44, {
        flow: 'posoperatorio', provider, model: modelName, tokens: result.tokens,
        responseTimeMs: Date.now() - startMs,
      }));
    } else {
      text = String(await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'gemini_3_flash',
      }) || '').trim();
      waitUntil(logLLMUsage(base44, {
        flow: 'posoperatorio', provider, model: modelName,
        responseTimeMs: Date.now() - startMs,
      }));
    }

    if (!text) {
      return Response.json({ error: 'A IA não retornou texto. Tente novamente.' }, { status: 502 });
    }

    return Response.json({ text, fonte });
  } catch (error) {
    if (base44) {
      waitUntil(logLLMUsage(base44, {
        flow: 'posoperatorio', provider, model: modelName,
        responseTimeMs: Date.now() - startMs, status: 'erro',
      }));
    }
    const status = error instanceof ProviderError ? error.status : 500;
    return Response.json({ error: error.message }, { status });
  }
}
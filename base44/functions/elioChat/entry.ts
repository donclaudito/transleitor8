import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';
import { resolveProvider, callProviderLLM, logLLMUsage, toHtml, ProviderError } from '../../shared/llm.ts';

// Chat da Elvira (assistente clínica) roteado pelo provedor externo escolhido no
// seletor da página /elio (LLMConfig ativo). A conversa vive na sessão local do
// frontend; esta função recebe o histórico e devolve a resposta em HTML.
// Uso registrado em LLMUsageLog com flow 'conversa' — separado do fluxo 'evolucao'.
const ELIO_SYSTEM_MESSAGE = [
  'Você é a Elvira, assistente clínica do Transleitor, plataforma de documentação médica brasileira.',
  'Você apoia médicos: redigir evoluções, interpretar exames, sugerir condutas e planejar tratamentos.',
  '',
  'REGRAS CLÍNICAS (OBRIGATÓRIAS):',
  '1. Use APENAS os dados fornecidos na conversa. Nunca invente valores de exames, medicamentos, posologias, sinais vitais ou achados de exame físico.',
  '2. Quando faltar informação, diga explicitamente o que é preciso e como obtê-la — não preencha lacunas com suposições.',
  '3. Suas respostas são apoio à decisão: a conduta final é sempre do médico responsável.',
  '4. Responda em português do Brasil, com terminologia médica formal, direta e objetiva.',
  '5. Formate a resposta em HTML semântico quando útil (<p>, <strong>, <ul>/<li>) — nunca Markdown.',
].join('\n');

export default async function(req) {
  const startMs = Date.now();
  let provider = '';
  let modelName = '';
  let base44 = null;

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { llm_config_id, messages } = body || {};
    if (!llm_config_id) return Response.json({ error: 'llm_config_id é obrigatório' }, { status: 400 });

    const history = Array.isArray(messages) ? messages : [];
    const msgs = history
      .slice(-20)
      .filter(m => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .map(m => ({ role: m.role, content: m.content.slice(0, 6000) }));
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') {
      return Response.json({ error: 'Histórico inválido: a última mensagem deve ser do usuário' }, { status: 400 });
    }

    const { llm, apiKey } = await resolveProvider(base44, llm_config_id);
    provider = llm.provider_name;
    modelName = llm.model_name;

    const transcript = msgs
      .map(m => `${m.role === 'user' ? 'MÉDICO' : 'ELVIRA'}: ${m.content}`)
      .join('\n\n');

    const { text, tokens } = await callProviderLLM({
      llm,
      apiKey,
      systemMessage: ELIO_SYSTEM_MESSAGE,
      userContent: transcript,
      temperature: 0.3,
    });

    waitUntil(logLLMUsage(base44, {
      flow: 'conversa', provider, model: modelName, tokens,
      responseTimeMs: Date.now() - startMs,
    }));

    return Response.json({ text: toHtml(text), provider, model: modelName });
  } catch (error) {
    if (base44) {
      waitUntil(logLLMUsage(base44, {
        flow: 'conversa', provider, model: modelName,
        responseTimeMs: Date.now() - startMs, status: 'erro',
      }));
    }
    return Response.json({ error: error.message }, { status: error instanceof ProviderError ? error.status : 500 });
  }
}
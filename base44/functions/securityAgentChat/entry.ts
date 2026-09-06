import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { resolveProvider, callProviderLLM, toHtml } from '../../shared/llm.ts';

// Chat do Agente de Segurança (somente admin) roteado pelo Groq (provedor próprio,
// LLMConfig ativo com provider_name "Groq") — não depende dos créditos de integração
// da plataforma. Recebe o histórico da conversa e devolve a resposta em HTML.
// Contexto: os últimos achados de SecurityFinding, para o auditor raciocinar sobre o
// estado real do painel. O auditor é consultivo: analisa e orienta; nunca altera dados.
const SYSTEM_PROMPT = `Você é o Agente de Segurança do Transleitor, plataforma clínica de documentação médica. Atue como um auditor sênior de segurança de aplicações, operando em duas frentes:

RED TEAM (ofensivo): procure vulnerabilidades exploráveis — chaves de API gravadas no cadastro em vez de variáveis de ambiente, URLs sem TLS, provedores de IA mal configurados, validação ausente, injeção de prompt em fluxos que usam dados do usuário.

BLUE TEAM (defensivo): revise a postura de proteção — RLS das entidades (dados clínicos são sensíveis: evoluções, pacientes, exames, achados), segregação de papéis (admin vs usuário), sigilo e integridade dos registros.

REGRAS OBRIGATÓRIAS:
1. Cada achado exige EVIDÊNCIA concreta (campo, valor, configuração) — nada de generalidades.
2. Para cada achado, proponha a CORREÇÃO recomendada.
3. Classifique cada achado: severity (critica, alta, media, baixa), category (configuracao, criptografia, exposicao, rls, validacao) e vector (red ou blue).
4. Ao identificar um achado relevante, sugira registrá-lo no painel de Segurança (entidade SecurityFinding) — a decisão de registrar e corrigir é sempre do administrador.
5. NUNCA altere ou exclua dados: você analisa e orienta a correção.
6. Responda em português do Brasil, técnico e direto. Nunca exponha valores de segredos — apenas nomes de variáveis de ambiente.
7. Formate a resposta em HTML semântico (<p>, <strong>, <ul>/<li>, <h3>) — sem Markdown.`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const history = Array.isArray(body?.messages) ? body.messages : [];
    const msgs = history
      .slice(-24)
      .filter(m => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));
    if (!msgs.some(m => m.role === 'user')) {
      return Response.json({ error: 'Nenhuma mensagem válida fornecida' }, { status: 400 });
    }

    // Provedor Groq ativo (configurado em LLMConfig pelo admin).
    const groqConfigs = await base44.asServiceRole.entities.LLMConfig.filter({ provider_name: 'Groq', is_active: true });
    if (!groqConfigs?.length) {
      return Response.json({ error: 'Provedor Groq não encontrado ou inativo em Provedores de IA' }, { status: 503 });
    }
    const { llm, apiKey } = await resolveProvider(base44, groqConfigs[0].id);

    // Contexto: últimos achados registrados no painel de Segurança.
    const findings = await base44.entities.SecurityFinding.list('-created_date', 30);
    const findingsContext = findings.length
      ? findings.map(f => `- [${f.status}] (${f.severity ?? '?'}/${f.vector ?? '?'}) ${f.title}`).join('\n')
      : 'Nenhum achado registrado.';

    const conversation = msgs.map(m => `${m.role === 'user' ? 'ADMIN' : 'AGENT'}: ${m.content}`).join('\n');
    const userContent = 'ACHADOS DE SEGURANÇA ATUAIS NO PAINEL:\n' + findingsContext + '\n\nCONVERSA COM O ADMINISTRADOR:\n' + conversation;

    const { text } = await callProviderLLM({ llm, apiKey, systemMessage: SYSTEM_PROMPT, userContent, temperature: 0.2 });
    return Response.json({ text: toHtml(text), provider: llm.provider_name, model: llm.model_name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error?.status || 500 });
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';
import { resolveProvider, callProviderLLM, logLLMUsage, toHtml, ProviderError } from '../../shared/llm.ts';

// Consulta ao RAG de imaginologia: recuperação lexical determinística sobre
// FonteImaginologia (filtros por modalidade/população/tipo/nível), contexto
// numerado com proveniência e resposta citada via provedor externo. Sem trecho
// relevante, o LLM NÃO é chamado — resposta honesta de ausência de evidência.

const SYSTEM_MESSAGE = [
  'Você é o Agente de Imaginologia do Transleitor — apoio à decisão em diagnóstico por imagem (TC, US, RM, radiologia intervencionista), baseado exclusivamente em fontes autorizadas.',
  '',
  'REGRAS DE OURO (OBRIGATÓRIAS):',
  '1. Responda EXCLUSIVAMENTE com base nos TRECHOS RECUPERADOS fornecidos no contexto. Toda afirmação clínica exige trecho de suporte.',
  '2. Cite a fonte de cada afirmação no formato [Fonte: ORGANIZAÇÃO — Documento (versão/ano)], usando exatamente os metadados do trecho que a embasa.',
  '3. NÃO invente diretrizes, limiares, taxas, doses, sensibilidades, DOI ou URLs. Se o contexto não cobre algo, declare que não há evidência na base autorizada.',
  '4. Se a pergunta contiver premissa falsa, refute com clareza e apresente o fato correto do contexto com a respectiva citação.',
  '5. Não substitui o médico: a decisão final é do profissional responsável. Em situação de emergência, oriente procura imediata de serviço de urgência.',
  '6. Responda em português do Brasil e formate a resposta em HTML semântico (<p>, <strong>, <ul>/<li>) — nunca Markdown.',
].join('\n');

const SEM_EVIDENCIA_HTML = '<p><strong>Não consta nas fontes autorizadas.</strong> Não há trecho relevante na base para responder a esta pergunta com segurança. Recomendo consultar a diretriz vigente da sociedade de especialidade correspondente ou um profissional qualificado.</p>';

const STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'o', 'a', 'os', 'as', 'um', 'uma', 'em', 'no', 'na', 'nos', 'nas',
  'para', 'por', 'com', 'que', 'qual', 'quais', 'como', 'ao', 'aos', 'seu', 'sua', 'sobre', 'é', 'ser',
  'the', 'of', 'to', 'in', 'is', 'what', 'which', 'how', 'or', 'and', 'for', 'with',
]);

// Normalização determinística: minúsculas, sem acentos, apenas alfanuméricos.
const normalizar = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ');

const tokenizar = (s) => normalizar(s).split(/\s+/).filter(t => t.length > 1 && !STOPWORDS.has(t));

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
    const pergunta = String(body?.pergunta || '').trim();
    const llmConfigId = String(body?.llm_config_id || '');
    const filtros = body?.filtros || {};
    if (!pergunta) return Response.json({ error: 'pergunta é obrigatória' }, { status: 400 });

    // Recuperação: busca por modalidade quando informada, filtros restantes em memória.
    let registros;
    if (filtros.modalidade) {
      const mod = String(filtros.modalidade).trim().toLowerCase();
      if (!['tc', 'us', 'rm', 'ri'].includes(mod)) {
        return Response.json({ error: 'filtros.modalidade inválida: use tc, us, rm ou ri' }, { status: 400 });
      }
      registros = await base44.entities.FonteImaginologia.filter({ modalidade: mod }, '-created_date', 2000);
    } else {
      registros = await base44.entities.FonteImaginologia.list('-created_date', 2000);
    }

    const nivelMin = Number(filtros.nivel_confianca_min);
    const popBusca = filtros.populacao ? normalizar(filtros.populacao) : '';
    const tipoBusca = filtros.tipo_documento ? normalizar(filtros.tipo_documento) : '';

    const candidatos = registros.filter(r => {
      if (Number.isFinite(nivelMin) && (Number(r.nivel_confianca) || 0) < nivelMin) return false;
      const pop = normalizar(r.populacao);
      if (popBusca && pop && !pop.includes(popBusca)) return false;
      const tipo = normalizar(r.tipo_documento);
      if (tipoBusca && tipo && !tipo.includes(tipoBusca)) return false;
      return true;
    });

    // Pontuação lexical determinística: cobertura dos termos da pergunta no trecho.
    const termosPergunta = [...new Set(tokenizar(pergunta))];
    const pontuados = [];
    candidatos.forEach((r) => {
      if (!termosPergunta.length) return;
      const termosTrecho = new Set(tokenizar(`${r.trecho} ${r.documento} ${r.organizacao}`));
      const acertos = termosPergunta.filter(t => termosTrecho.has(t));
      if (!acertos.length) return;
      const cobertura = acertos.length / termosPergunta.length;
      const minimo = Math.min(2, termosPergunta.length);
      if (acertos.length >= minimo && cobertura >= 0.3) {
        pontuados.push({ registro: r, acertos: acertos.length, cobertura });
      }
    });

    // Ranqueia: cobertura > nível de confiança > ordem no documento (determinístico).
    pontuados.sort((x, y) =>
      y.cobertura - x.cobertura ||
      (y.registro.nivel_confianca || 0) - (x.registro.nivel_confianca || 0) ||
      (x.registro.ordem_no_documento || 0) - (y.registro.ordem_no_documento || 0));

    // top_k com limite de 2 trechos por documento-fonte.
    const topK = Math.min(12, Math.max(3, Number(body?.top_k) || 6));
    const porFonte = new Map();
    const selecionados = [];
    for (const p of pontuados) {
      const chave = `${p.registro.organizacao}|${p.registro.documento}`;
      if ((porFonte.get(chave) || 0) >= 2) continue;
      porFonte.set(chave, (porFonte.get(chave) || 0) + 1);
      selecionados.push(p.registro);
      if (selecionados.length >= topK) break;
    }

    // Sem trecho relevante: NÃO chama o LLM — resposta honesta de ausência de evidência.
    if (!selecionados.length) {
      return Response.json({
        sem_evidencia: true,
        text: SEM_EVIDENCIA_HTML,
        fontes: [],
      });
    }

    if (!llmConfigId) {
      return Response.json({ error: 'llm_config_id é obrigatório quando há trechos relevantes' }, { status: 400 });
    }

    const contexto = selecionados.map((r, i) => {
      const meta = [
        `Fonte: ${r.organizacao} — ${r.documento}`,
        r.versao ? `(${r.versao})` : '',
        r.data_publicacao ? `— ${r.data_publicacao}` : '',
        `· modalidade: ${String(r.modalidade).toUpperCase()}`,
        `· nível de confiança: ${r.nivel_confianca}`,
      ].filter(Boolean).join(' ');
      return `[${i + 1}] ${meta}\n${r.trecho}`;
    }).join('\n\n');

    const userContent = [
      `PERGUNTA: ${pergunta}`,
      '',
      'TRECHOS RECUPERADOS (contexto numerado com proveniência):',
      contexto,
      '',
      'Estruture a resposta: síntese direta (1–3 frases) com a fonte principal, desenvolvimento por seções quando útil e citações [Fonte: ...] em toda afirmação clínica.',
    ].join('\n');

    const { llm, apiKey } = await resolveProvider(base44, llmConfigId);
    provider = llm.provider_name;
    modelName = llm.model_name;

    const { text, tokens } = await callProviderLLM({
      llm,
      apiKey,
      systemMessage: SYSTEM_MESSAGE,
      userContent,
      temperature: 0.1,
    });

    waitUntil(logLLMUsage(base44, {
      flow: 'imaginologia', provider, model: modelName, tokens,
      responseTimeMs: Date.now() - startMs,
    }));

    return Response.json({
      sem_evidencia: false,
      text: toHtml(text),
      fontes: selecionados.map(r => ({
        organizacao: r.organizacao,
        documento: r.documento,
        versao: r.versao,
        data_publicacao: r.data_publicacao,
        modalidade: r.modalidade,
        nivel_confianca: r.nivel_confianca,
      })),
      provider,
      model: modelName,
    });
  } catch (error) {
    if (base44) {
      waitUntil(logLLMUsage(base44, {
        flow: 'imaginologia', provider, model: modelName,
        responseTimeMs: Date.now() - startMs, status: 'erro',
      }));
    }
    return Response.json({ error: error.message }, { status: error instanceof ProviderError ? error.status : 500 });
  }
}
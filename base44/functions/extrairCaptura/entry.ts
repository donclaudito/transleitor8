import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil, secrets } from 'base44:runtime';
import { traceLlmRun, callProviderLLM, logLLMUsage } from '../../shared/llm.ts';

// Extração de texto de laudos/exames capturados (foto ou PDF) para o módulo de
// capturas. Imagens seguem pelo provedor de visão externo cadastrado em LLMConfig
// (sem consumir integrações da plataforma); PDFs usam o InvokeLLM nativo com anexo.
const SYSTEM_MESSAGE = [
  'Você é um assistente de extração de documentos médicos (laudos e exames).',
  'TAREFA: transcrever fielmente TODO o conteúdo textual do documento fornecido.',
  'REGRAS OBRIGATÓRIAS:',
  '1. ANONIMIZE: substitua nome do paciente, registro/prontuário, leito e qualquer identificação pessoal por [ANONIMIZADO].',
  '2. Preserve exatamente valores, datas, unidades, valores de referência e a ordem dos resultados. NÃO invente, corrija, complete ou omita dados.',
  '3. Se o documento for ilegível, cortado ou não for médico, responda apenas: DOCUMENTO ILEGÍVEL OU NÃO MÉDICO.',
  '4. Responda em TEXTO PURO, sem HTML e sem Markdown, pronto para colar em um prontuário eletrônico.',
].join('\n');

export default async function (req) {
  const chainStart = new Date().toISOString();
  const startMs = Date.now();
  let provider = '';
  let modelName = '';
  let base44 = null;

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { image_data_url, file_url, tipo } = await req.json();
    if (!image_data_url && !file_url) {
      return Response.json({ error: 'Envie uma imagem ou um PDF.' }, { status: 400 });
    }

    const tipoTexto = tipo === 'laudo' ? 'laudo médico' : 'resultado de exame';
    let extracao = '';

    if (image_data_url) {
      // Foto/imagem: roteamento pelo primeiro provedor de visão ativo (ordem de criação).
      const visionProviders = await base44.asServiceRole.entities.LLMConfig.filter(
        { is_active: true, supports_image: true }
      );
      if (!visionProviders.length) {
        return Response.json({
          error: 'Nenhum provedor de análise de imagem ativo. Cadastre um modelo com suporte a imagem em Provedores de IA.',
        }, { status: 400 });
      }
      visionProviders.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const llm = visionProviders[0];
      const apiKey = secrets.get(llm.api_key_env_var);
      if (!apiKey) {
        return Response.json({ error: `Chave API não configurada: ${llm.api_key_env_var}` }, { status: 500 });
      }

      provider = llm.provider_name;
      modelName = llm.model_name;
      const { text: rawText, tokens } = await callProviderLLM({
        llm,
        apiKey,
        systemMessage: SYSTEM_MESSAGE,
        userContent: [
          { type: 'image_url', image_url: { url: image_data_url } },
          { type: 'text', text: `Transcreva integralmente este documento (${tipoTexto}), anonimizado.` },
        ],
      });
      extracao = (rawText || '').trim();

      const usageLogId = await logLLMUsage(base44, {
        flow: 'imagem', provider, model: modelName, tokens,
        responseTimeMs: Date.now() - startMs,
      });
      waitUntil(traceLlmRun({
        name: `${provider} ${modelName}`,
        inputs: { fonte: 'captura-imagem' },
        outputs: { output: extracao },
        startTime: chainStart,
        endTime: new Date().toISOString(),
        tags: ['extrairCaptura'],
      }));
    } else {
      // PDF: extração pela integração nativa (InvokeLLM com anexo).
      provider = 'plataforma';
      modelName = 'invoke-llm';
      const resp = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_MESSAGE}\n\nTranscreva integralmente o documento anexado (${tipoTexto}), anonimizado.`,
        file_urls: [file_url],
      });
      extracao = (typeof resp === 'string' ? resp : (resp?.text || resp?.content || '')).trim();

      await logLLMUsage(base44, {
        flow: 'imagem', provider, model: modelName,
        responseTimeMs: Date.now() - startMs,
      });
      waitUntil(traceLlmRun({
        name: 'plataforma invoke-llm',
        inputs: { fonte: 'captura-pdf', file_url },
        outputs: { output: extracao },
        startTime: chainStart,
        endTime: new Date().toISOString(),
        tags: ['extrairCaptura'],
      }));
    }

    if (!extracao) {
      return Response.json({ error: 'A extração não retornou texto.' }, { status: 502 });
    }
    return Response.json({ text: extracao });
  } catch (error) {
    if (base44) {
      waitUntil(logLLMUsage(base44, {
        flow: 'imagem', provider, model: modelName,
        responseTimeMs: Date.now() - startMs, status: 'erro',
      }));
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
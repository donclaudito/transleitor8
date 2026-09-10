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

// Extrai o texto bruto de um PDF localmente (sem consumir integrações da plataforma).
async function extractPdfText(bytes) {
  const { extractText, getDocumentProxy } = await import('npm:unpdf@0.12');
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return (text || '').trim();
}

// Fallback DeepSeek: transcreve/anonimiza o texto bruto com os créditos próprios do médico.
async function transcribeWithDeepSeek(textoBruto, tipoTexto) {
  const apiKey = secrets.get('DEEPSEEK_API_KEY');
  if (!apiKey) throw new Error('Fallback indisponível: chave DeepSeek não configurada (DEEPSEEK_API_KEY).');
  const { text, tokens } = await callProviderLLM({
    llm: { api_url: 'https://api.deepseek.com/chat/completions', model_name: 'deepseek-chat' },
    apiKey,
    systemMessage: SYSTEM_MESSAGE,
    userContent: `Transcreva integralmente este documento (${tipoTexto}), anonimizado.\n\nCONTEÚDO EXTRAÍDO DO PDF (preserve a ordem, valores e unidades):\n${textoBruto}`,
  });
  return { text: (text || '').trim(), tokens };
}

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

    const { image_data_url, file_url, pdf_data_url, tipo } = await req.json();
    if (!image_data_url && !file_url && !pdf_data_url) {
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
      // PDF: prioriza a integração nativa (InvokeLLM com anexo). Sem créditos da
      // plataforma (402) ou em outro erro, cai para a DeepSeek: texto extraído do
      // PDF localmente + transcrição com os créditos próprios do médico.
      let nativoFalhou = file_url ? false : true; // pdf_data_url já vem do modo sem upload
      if (file_url) {
        try {
          provider = 'plataforma';
          modelName = 'invoke-llm';
          const resp = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `${SYSTEM_MESSAGE}\n\nTranscreva integralmente o documento anexado (${tipoTexto}), anonimizado.`,
            file_urls: [file_url],
          });
          extracao = (typeof resp === 'string' ? resp : (resp?.text || resp?.content || '')).trim();
        } catch (_) {
          nativoFalhou = true;
        }
      }

      let tokens = null;
      if (!extracao && nativoFalhou) {
        let textoBruto = '';
        if (pdf_data_url) {
          const b64 = (pdf_data_url.split(',')[1] || '').trim();
          textoBruto = await extractPdfText(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
        } else {
          const bytes = new Uint8Array(await (await fetch(file_url)).arrayBuffer());
          textoBruto = await extractPdfText(bytes);
        }
        if (!textoBruto) {
          return Response.json({
            error: 'Não foi possível extrair texto deste PDF (provavelmente digitalizado em imagem). Tente fotografar as páginas.',
          }, { status: 400 });
        }
        provider = 'DeepSeek';
        modelName = 'deepseek-chat';
        const resposta = await transcribeWithDeepSeek(textoBruto, tipoTexto);
        extracao = resposta.text;
        tokens = resposta.tokens;
      }

      await logLLMUsage(base44, {
        flow: 'imagem', provider, model: modelName, tokens,
        responseTimeMs: Date.now() - startMs,
      });
      waitUntil(traceLlmRun({
        name: `${provider} ${modelName}`,
        inputs: { fonte: 'captura-pdf', file_url: file_url || 'inline' },
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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Carga do corpus de imaginologia (RAG): recebe documentos com metadados de
// proveniência no payload (nunca baixa nada da internet), fragmenta em trechos
// de até ~2000 caracteres sem quebrar linhas/tabelas no meio e grava em
// FonteImaginologia. Execução restrita a administradores.

const MODALIDADES = ['tc', 'us', 'rm', 'ri'];
const MAX_CHARS = 2000;
const MAX_DOCS = 50;

// Divide o texto em trechos de até maxChars: prefere fronteiras de parágrafo
// (linha em branco); blocos/linhas individuais maiores que o limite são
// divididos por linha e, em último caso, por sentença — nunca no meio de uma
// linha, preservando linhas de tabela íntegras.
function chunkText(texto, maxChars = MAX_CHARS) {
  const blocos = String(texto).split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const trechos = [];
  let atual = '';
  const fechar = (s) => { if (s.trim()) trechos.push(s.trim()); };

  const adicionarBlocoLongo = (bloco) => {
    if (atual) { fechar(atual); atual = ''; }
    let linhaBuf = '';
    for (const linha of bloco.split('\n')) {
      const cand = linhaBuf ? linhaBuf + '\n' + linha : linha;
      if (cand.length > maxChars) {
        fechar(linhaBuf);
        if (linha.length > maxChars) {
          // última instância: fragmenta a própria linha por sentença
          let sentBuf = '';
          for (const parte of linha.split(/(?<=[.;:])\s+/)) {
            if ((sentBuf + ' ' + parte).trim().length > maxChars) { fechar(sentBuf); sentBuf = parte; }
            else sentBuf = sentBuf ? sentBuf + ' ' + parte : parte;
          }
          fechar(sentBuf);
        } else {
          linhaBuf = linha;
        }
      } else {
        linhaBuf = cand;
      }
    }
    fechar(linhaBuf);
  };

  for (const bloco of blocos) {
    if (bloco.length > maxChars) { adicionarBlocoLongo(bloco); continue; }
    const cand = atual ? atual + '\n\n' + bloco : bloco;
    if (cand.length > maxChars) { fechar(atual); atual = bloco; }
    else atual = cand;
  }
  fechar(atual);
  return trechos;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Apenas administradores podem carregar o corpus de imaginologia' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const documentos = Array.isArray(body?.documentos) ? body.documentos : [];
    if (!documentos.length) {
      return Response.json({ error: 'documentos é obrigatório (array de documentos com metadados)' }, { status: 400 });
    }
    if (documentos.length > MAX_DOCS) {
      return Response.json({ error: `Máximo de ${MAX_DOCS} documentos por carga` }, { status: 400 });
    }

    const records = [];
    for (const doc of documentos) {
      const organizacao = String(doc?.organizacao || '').trim();
      const documento = String(doc?.documento || '').trim();
      const texto = String(doc?.texto || '');
      const modalidade = String(doc?.modalidade || '').trim().toLowerCase();
      const nivel = Number(doc?.nivel_confianca);

      if (!organizacao || !documento || !texto.trim()) {
        return Response.json({ error: 'Documento inválido: organizacao, documento e texto são obrigatórios' }, { status: 400 });
      }
      if (!MODALIDADES.includes(modalidade)) {
        return Response.json({ error: `Modalidade inválida "${modalidade}" em "${documento}": use tc, us, rm ou ri` }, { status: 400 });
      }
      if (!Number.isInteger(nivel) || nivel < 1 || nivel > 5) {
        return Response.json({ error: `nivel_confianca inválido em "${documento}": use número inteiro de 1 a 5` }, { status: 400 });
      }

      const trechos = chunkText(texto);
      trechos.forEach((trecho, idx) => {
        records.push({
          modalidade,
          populacao: String(doc?.populacao || '').trim(),
          tipo_documento: String(doc?.tipo_documento || '').trim(),
          nivel_confianca: nivel,
          data_publicacao: String(doc?.data_publicacao || '').trim(),
          organizacao,
          documento,
          versao: String(doc?.versao || '').trim(),
          trecho,
          ordem_no_documento: idx + 1,
        });
      });
    }

    const porModalidade = { tc: 0, us: 0, rm: 0, ri: 0 };
    records.forEach(r => { porModalidade[r.modalidade] += 1; });

    // bulkCreate em lotes de até 500 registros
    for (let i = 0; i < records.length; i += 500) {
      await base44.entities.FonteImaginologia.bulkCreate(records.slice(i, i + 500));
    }

    return Response.json({
      total_chunks: records.length,
      documentos: documentos.length,
      por_modalidade: porModalidade,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
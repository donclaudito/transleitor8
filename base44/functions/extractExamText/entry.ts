import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Extração de texto de exames fotografados (laudos, laboratoriais, impressos)
// com ANONIMIZAÇÃO OBRIGATÓRIA (LGPD). Chamado pelo LaudoCaptureButton após o
// upload da foto; a persistência em ExamAttachment fica no cliente (RLS por
// usuário). O InvokeLLM roda em service role conforme a regra da plataforma.
const SYSTEM_PROMPT = `Você é um módulo de OCR clínico do Transleitor. Sua função é transcrever fotos de exames (resultados laboratoriais, laudos de imagem, impressos hospitalares) para texto estruturado, já ANONIMIZADO.

CONDIÇÕES DE IMAGEM: fotos de celular podem ter baixa luminosidade, clarão, sombra, leve desfoque ou rotação (até 45°). Aplique correção mental de contraste: o texto impresso costuma ser mais escuro que o fundo. Distinga RUÍDO de TEXTO: manchas, dedos sobre o papel e reflexos NÃO são caracteres.

REGRAS DE TRANSCRIÇÃO:
1. Transcreva SOMENTE o que está visível. NUNCA invente valores, exames ou linhas. Se uma linha for ilegível, escreva [ilegível] no lugar.
2. Preserve exatamente números, unidades e intervalos de referência (ex: Hb 9,2 g/dL; Leucócitos 14.500/mm³; PCR 18 mg/dL).
3. Tabelas com colunas: transcreva linha por linha, completa (exame, resultado, referência), nunca fragmentando uma linha.
4. ANONIMIZAÇÃO OBRIGATÓRIA (LGPD): substitua pelos marcadores:
   - Nomes de pacientes, nome da mãe, nomes de médicos → [nome removido]
   - Nome de hospital, clínica, laboratório, cidade → [local removido]
   - Prontuário, CPF, RG, CNS, data de nascimento → [identificador removido]
   MANTENHA: idade, sexo, leito, data do exame e todos os dados clínicos e valores.
5. exam_type: classifique em uma expressão curta: "Laboratorial", "Raio-x", "TC", "US", "RM", "Laudo clínico", "Outro".
6. Se absolutamente nada for legível, retorne status "error" com message pedindo nova foto mais nítida. NUNCA invente dados.

Responda ESTRITAMENTE no formato JSON abaixo, sem texto explicativo adicional, sem markdown, sem crases.`;

const SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['success', 'error'] },
    data: {
      type: 'object',
      properties: {
        extracao: { type: 'string' },
        exam_type: { type: 'string' },
      },
      required: ['extracao', 'exam_type'],
    },
    ui_action: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
  required: ['status', 'data'],
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fileUrl = typeof body?.file_url === 'string' ? body.file_url.trim() : '';
    if (!/^https?:\/\//i.test(fileUrl)) {
      return Response.json({ error: 'file_url inválida' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: SYSTEM_PROMPT,
      file_urls: [fileUrl],
      response_json_schema: SCHEMA,
      model: 'gemini_3_flash',
    });

    if (result?.status === 'error' || !result?.data?.extracao) {
      return Response.json(
        { error: result?.ui_action?.message || 'Não foi possível ler o exame na foto. Tire uma foto mais nítida.' },
        { status: 422 }
      );
    }

    return Response.json({
      extracao: result.data.extracao,
      exam_type: result.data.exam_type || '',
      anonimizado: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PassagemVisita({ currentSOAP, selectedLLMId = '', llmProviders = [] }) {
  const [passageText, setPassageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const activeProvider = selectedLLMId ? llmProviders.find(p => p.id === selectedLLMId) : null;

  // Reseta a passagem quando uma nova evolução é carregada
  useEffect(() => {
    setPassageText('');
  }, [currentSOAP?.id]);

  const handleGenerate = async () => {
    if (!currentSOAP) return;
    setLoading(true);
    try {
      const ctx = `Dados do paciente:
- Iniciais: ${currentSOAP.patient_initials || '—'}
- Leito: ${currentSOAP.bed || '—'} | Setor: ${currentSOAP.sector || '—'}
- Comorbidades: ${currentSOAP.comorbidities || '—'}

Descrição clínica atual:
${currentSOAP.clinical_description || '—'}

Exames complementares:
${currentSOAP.labs || '—'}

Evolução clínica gerada (extraia condutas e pendências daqui):
${currentSOAP.soap_text || '—'}`;

      const sector = (currentSOAP.sector || '').toLowerCase();
      const isCirurgia = sector.includes('cirúrg') || sector.includes('cirurg');

      const surgicalPrompt = `Você é um assistente cirúrgico especialista em sintaxe médica e comunicação intra-hospitalar. Extraia os dados da Evolução Médica Pós-Operatória e gere um RESUMO DE PASSAGEM DE PLANTÃO (Handover) ultradirecionado para o cirurgião que assumirá o plantão seguinte.

${ctx}

REGRAS DE SINTAXE E FORMATO:
1. OMITA EXPRESSAMENTE: nome do paciente, iniciais, número de leito e número de prontuário.
2. Estilo: direto, cirúrgico, sem rodeios, focado na segurança do paciente e nas pendências do plantão.
3. Gere APENAS texto puro (sem HTML, sem Markdown, sem **, sem ##, sem -). Use * no início das linhas de campo conforme o modelo.
4. Siga ESTRITAMENTE o modelo abaixo:

📌 PROCEDIMENTO E TEMPO PÓS-OPERATÓRIO
* [Cirurgia realizada] — [X]º PO.

🩺 STATUS CLÍNICO E EVOLUÇÃO (Últimas 24h)
* Quadro geral: [Estável / Instável / Em observação] | [Aceitação da dieta] | [Trânsito intestinal: gases/fezes].
* Exame Físico / Abdome: [Sinais abdominais relevantes, presença/ausência de peritonismo].
* Dispositivos / Drenos: [Aspecto e débito dos drenos nas últimas 24h ou ausência de drenos].
* Laboratório / Imagem: [Alterações laboratoriais críticas do dia ou exames normais].

🎯 CONDUTAS E INTERCONSULTAS EM ANDAMENTO
* Interconsultas: [Especialidades acionadas e status do parecer, se houver].
* Principais condutas: [Ajustes de ATB, progressão de dieta, desmame de drogas, etc.].

⚠️ PONTOS DE ATENÇÃO / O QUE VIGIAR NO PLANTÃO
* [Alertas específicos para o plantonista: monitorar débito do dreno X, checar hemograma de controle, reavaliar dor, aguardar parecer, etc.].
* Planejamento: [Previsão de alta / Manutenção de conduta].

Não invente dados. Use apenas as informações fornecidas.`;

      const genericPrompt = `Você é um médico sênior brasileiro. Gere um resumo de PASSAGEM DE VISITA ultraconciso para outro colega entender o caso rapidamente.

${ctx}

REGRAS ABSOLUTAS:
1. OMITA EXPRESSAMENTE: nome do paciente, iniciais, número de leito e número de prontuário — NÃO inclua nenhum campo de identificação do paciente.
2. Gere APENAS texto puro (sem HTML, sem Markdown, sem **, sem ##, sem -).
3. Use EXATAMENTE estes 4 campos em linha, nesta ordem, separados por " | ":
   Motivo: ... | Quadro atual: ... | Condutas: ... | Pendências: ...
4. Campo "Motivo": motivo principal de internação/consulta em 1 frase curta.
5. Campo "Quadro atual": estado clínico atual em 2–3 frases telegráficas.
6. Campo "Condutas": o que foi feito/está em curso (ATB, procedimentos, ajustes).
7. Campo "Pendências": exames aguardados, avaliações, decisões pendentes.
8. Máximo 5 linhas no total. Ultraconciso. Não invente dados.`;

      const prompt = isCirurgia ? surgicalPrompt : genericPrompt;

      const res = await base44.functions.invoke('generateSOAP', {
        prompt,
        ...(selectedLLMId ? { llm_config_id: selectedLLMId } : {}),
        output_format: 'text',
      });
      if (res.data?.error) throw new Error(res.data.error);
      const result = res.data.text;

      setPassageText(typeof result === 'string' ? result.trim() : '');
    } catch (err) {
      alert('Erro ao gerar passagem: ' + (err?.message || 'erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!passageText) return;

    // 1. Copia o texto de forma SINCRONA primeiro (execCommand), ainda dentro do gesto do clique.
    //    Isto garante que o texto já está na área de transferência antes de o foco mudar.
    const ta = document.createElement('textarea');
    ta.value = passageText;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let copiedSync = false;
    try { copiedSync = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);

    // 2. Abre a aba destino APÓS a cópia, ainda no mesmo gesto síncrono (evita popup blocker).
    const win = window.open('https://passagem.base44.app/', '_blank');

    // 3. Reforço assíncrono com a Clipboard API moderna (pode falhar se o foco mudou, daí o fallback acima).
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(passageText).catch(() => {});
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (!win) {
      alert('O popup foi bloqueado, mas o texto já foi copiado. Permita popups para este site ou cole manualmente na passagem.');
    }
  };

  return (
    <div className="pt-4 mt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">🔁</span>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Passagem de Visita</h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${activeProvider ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-primary/10 text-primary border-primary/20'}`}>
          {activeProvider ? `⚡ ${activeProvider.provider_name} — ${activeProvider.model_name}` : '✨ Gemini Flash'}
        </span>
      </div>

      {!passageText && !loading ? (
        <button
          onClick={handleGenerate}
          className="w-full py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-accent/50 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Gerar Passagem
        </button>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Gerando passagem...
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={passageText}
            onChange={(e) => setPassageText(e.target.value)}
            rows={5}
            className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-xs font-mono resize-y focus:outline-none focus:border-primary/50 transition-all leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary border border-primary/20 hover:bg-primary/5 transition-all flex items-center gap-1.5"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Passagem'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
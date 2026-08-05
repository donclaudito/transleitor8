import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PassagemVisita({ currentSOAP }) {
  const [passageText, setPassageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

      const prompt = `Você é um médico sênior brasileiro. Gere um resumo de PASSAGEM DE VISITA ultraconciso para outro colega entender o caso rapidamente.

${ctx}

REGRAS ABSOLUTAS:
1. Gere APENAS texto puro (sem HTML, sem Markdown, sem **, sem ##, sem -).
2. Use EXATAMENTE estes 5 campos em linha, nesta ordem, separados por " | ":
   Paciente: ... | Motivo: ... | Quadro atual: ... | Condutas: ... | Pendências: ...
3. Campo "Paciente": iniciais, leito e setor (ex: "G.S., Leito 5 — UTI Adulto").
4. Campo "Motivo": motivo principal de internação/consulta em 1 frase curta.
5. Campo "Quadro atual": estado clínico atual em 2–3 frases telegráficas.
6. Campo "Condutas": o que foi feito/está em curso (ATB, procedimentos, ajustes).
7. Campo "Pendências": exames aguardados, avaliações, decisões pendentes.
8. Máximo 5 linhas no total. Ultraconciso. Não invente dados.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'gemini_3_flash',
      });

      setPassageText(typeof result === 'string' ? result.trim() : '');
    } catch (err) {
      alert('Erro ao gerar passagem: ' + (err?.message || 'erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!passageText) return;
    navigator.clipboard?.writeText(passageText);
    window.open('https://passagem.base44.app/', '_blank');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-4 mt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">🔁</span>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Passagem de Visita</h4>
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
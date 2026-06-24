import React, { useState } from 'react';
import { TEST_NAME_MAP, REFERENCE_RANGES, getStatus } from '@/lib/examInterpreter';
import { generateMarkdownReport, generateHtmlReport } from '@/lib/examInterpreter';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { FlaskConical, Play, Copy, RefreshCw, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Tenta casar o nome extraído pela IA com um exame conhecido para obter ptName/ref padrão
function matchKnownTest(rawName) {
  const norm = normalize(rawName);
  if (!norm) return null;
  for (const [key, mapped] of Object.entries(TEST_NAME_MAP)) {
    const nk = normalize(key);
    if (nk === norm || nk.includes(norm) || norm.includes(nk)) {
      return { mapped, ref: REFERENCE_RANGES[mapped] };
    }
  }
  return null;
}

export default function InterpretacaoExames() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState(null);
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleInterpret = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResults(null);
    setReport('');
    try {
      // Pré-processamento: remove blocos administrativos repetidos (cabeçalho/rodapé de cada página)
      const cleanedText = inputText
        .replace(/Casa de Saúde[\s\S]*?Contato:\s*\([\d\s\)]+\)\s*\n/g, '')
        .replace(/Paciente\s+Data Nasc\.[\s\S]*?Material\s*\n/g, '')
        .replace(/Responsável Técnico[\s\S]*?interpretar corretamente\s*estes resultados\.?/g, '')
        .replace(/Página\s+\d+/g, '')
        .replace(/Aprovado por:[\s\S]*?\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/g, '')
        .replace(/Liberado por:[\s\S]*?\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const prompt = `Você é um bioquímico clínico. Extraia os exames laboratoriais do texto abaixo.

REGRAS ABSOLUTAS:

1. SÓ EXTRAIA O QUE EXISTE NO TEXTO. Se um exame não aparece com valor numérico, NÃO o crie. Zero alucinação.

2. HEMOGRAMA — formato "Nome  %  Absoluto  Referência":
   Ex: "Segmentados 62,0 % 3.162 40 a 80%"
   → value=62.0, unit="%", ref_min=40, ref_max=80 (SEMPRE o %, nunca o absoluto)
   → NÃO extraia exames com valor 0% que são sempre zero: Blastos, Promielócitos, Mielócitos, Metamielócitos, Linfócitos Reativos, Células Atípicas.

3. URINA vs SANGUE: "Leucócitos" no hemograma = sangue (5.1 10³/mm³). "Leucócitos 32.000" na urina = name "Leucócitos (Urina)", unit "/mL". São exames diferentes.

4. URINA: só pH, Densidade, Leucócitos/mL, Hemácias/mL. Ignore Cor, Aspecto, Proteínas, Glicose, Nitrito, Bactérias, Cristais (qualitativos).

5. CREATININA: use a faixa "Adulto" (0.30-1.30).

6. Vírgula = decimal brasileiro: "30,0"→30.0, "2,00"→2.0. Ponto = milhar: "3.162"→3162.

7. Cada exame UMA vez só.

Retorne name, value, unit, ref_min, ref_max para cada exame.

Texto:
"""
${cleanedText}
"""`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
        response_json_schema: {
          type: 'object',
          properties: {
            exams: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'number' },
                  unit: { type: 'string' },
                  ref_min: { type: 'number' },
                  ref_max: { type: 'number' },
                },
                required: ['name', 'value', 'ref_min', 'ref_max'],
              },
            },
          },
        },
      });

      const exams = res?.exams || [];
      const seen = new Set();
      const parsed = exams
        .filter(e => typeof e.value === 'number' && typeof e.ref_min === 'number' && typeof e.ref_max === 'number')
        .filter(e => {
          const key = normalize(e.name);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .filter(e => {
          // Excluir exames do hemograma que são sempre zero (não informativos)
          const n = normalize(e.name);
          const alwaysZero = ['blastos', 'promielocito', 'mielocito', 'metamielocito', 'linfocitos reativos', 'celulas atipicas'];
          if (alwaysZero.some(z => n.includes(z))) return false;
          // Rede de segurança: descarta valores absurdos
          const v = e.value;
          if (n.includes('sodio') || n.includes('sodium')) return v >= 100 && v <= 170;
          if (n.includes('potassio') || n.includes('potassium')) return v >= 2 && v <= 8;
          if ((n.includes('segmentad') || n.includes('bastonet') || n.includes('bast') || n.includes('eosinofil') || n.includes('basofil') || n.includes('linfocit') || n.includes('monocit')) && e.unit && e.unit.includes('%')) {
            return v >= 0 && v <= 100;
          }
          if (n.includes('leucocito') && !n.includes('urina')) return v >= 0 && v <= 50;
          if (n.includes('hemacias') && !n.includes('urina')) return v >= 1 && v <= 10;
          if (n.includes('plaquetas')) return v >= 10 && v <= 1000;
          return true;
        })
        .map(e => {
          const known = matchKnownTest(e.name);
          const ref = known?.ref || { min: e.ref_min, max: e.ref_max, unit: e.unit || '', ptName: e.name };
          return {
            name: known?.mapped || e.name,
            value: e.value,
            unit: e.unit || ref.unit || '',
            originalName: e.name,
            ptName: ref.ptName || e.name,
            ref,
            status: getStatus(e.value, ref),
          };
        });

      setResults(parsed);
      setReport(generateMarkdownReport(parsed));
    } catch (err) {
      setResults([]);
      setReport('');
      alert('Erro ao interpretar exames: ' + (err?.message || 'erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const html = generateHtmlReport(results);
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.style.position = 'fixed';
    tmp.style.left = '-9999px';
    tmp.style.top = '0';
    document.body.appendChild(tmp);
    const range = document.createRange();
    range.selectNodeContents(tmp);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    try { document.execCommand('copy'); } catch { navigator.clipboard?.writeText(html); }
    sel.removeAllRanges();
    document.body.removeChild(tmp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setInputText('');
    setResults(null);
    setReport('');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-6 py-4 flex items-center gap-4">
        <Link to="/transleitor" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-extrabold flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" /> Interpretação de Exames
          </h1>
          <p className="text-xs text-muted-foreground">Análise por IA de laudos laboratoriais colados de PDF</p>
        </div>
        {results && (
          <button onClick={handleReset} className="ml-auto flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl border border-border transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Limpar
          </button>
        )}
      </header>

      <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-sm">Cole o laudo dos exames</h2>
          <p className="text-xs text-muted-foreground">Cole o texto bruto do laudo (PDF, sistema do laboratório). A IA extrai e analisa automaticamente.</p>
          <textarea rows={12} value={inputText} onChange={e => setInputText(e.target.value)}
            placeholder="Cole aqui o laudo completo..."
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all font-mono" />
          <button onClick={handleInterpret} disabled={loading || !inputText.trim()}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 btn-press">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Analisando...' : 'Interpretar Exames'}
          </button>
        </div>

        {/* Results */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          {!results ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
              <FlaskConical className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Os resultados aparecerão aqui</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-sm font-medium">Nenhum exame reconhecido</p>
              <p className="text-xs mt-1">A IA não encontrou exames quantitativos no texto.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm">{results.length} exame(s) analisado(s)</h2>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-bold text-primary px-3 py-1.5 rounded-xl border border-primary/20 hover:bg-primary/5 transition-all">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left py-2.5 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Exame</th>
                      <th className="text-right py-2.5 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Valor</th>
                      <th className="text-right py-2.5 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Referência</th>
                      <th className="text-center py-2.5 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <motion.tr key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className={`border-b border-border/50 ${
                          r.status === 'normal' ? 'hover:bg-green-500/5' :
                          r.status === 'high' ? 'hover:bg-red-500/5' : 'hover:bg-blue-500/5'
                        }`}>
                        <td className="py-2.5 px-3 font-semibold">{r.ptName}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                          r.status === 'normal' ? 'text-foreground' :
                          r.status === 'high' ? 'text-red-500' : 'text-blue-500'
                        }`}>{r.value} <span className="text-xs font-normal text-muted-foreground">{r.ref.unit}</span></td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground text-xs">{r.ref.min} – {r.ref.max}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            r.status === 'normal' ? 'bg-green-500/15 text-green-500' :
                            r.status === 'high' ? 'bg-red-500/15 text-red-500' : 'bg-blue-500/15 text-blue-500'
                          }`}>
                            {r.status === 'normal' ? '✓' : r.status === 'high' ? '↑' : '↓'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {report && (
                <div className="mt-5 p-4 rounded-xl border border-border bg-muted/30">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
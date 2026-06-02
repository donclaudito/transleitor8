import React, { useState } from 'react';
import { interpretExams, generateMarkdownReport } from '@/lib/examInterpreter';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Play, Copy, RefreshCw, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InterpretacaoExames() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState(null);
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleInterpret = () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const parsed = interpretExams(inputText);
      setResults(parsed);
      setReport(generateMarkdownReport(parsed));
      setLoading(false);
    }, 500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
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
          <p className="text-xs text-muted-foreground">Análise de valores laboratoriais e faixas de referência</p>
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
          <p className="text-xs text-muted-foreground">Formato: Nome do exame: Valor Unidade (ex: Hemoglobina: 14.2 g/dL)</p>
          <textarea rows={12} value={inputText} onChange={e => setInputText(e.target.value)}
            placeholder="Hemoglobina: 14.2 g/dL&#10;Leucócitos: 8.5&#10;Creatinina: 1.0 mg/dL&#10;Glicose: 95 mg/dL"
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all font-mono" />
          <button onClick={handleInterpret} disabled={loading || !inputText.trim()}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 btn-press">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            Interpretar Exames
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
              <p className="text-xs mt-1">Verifique o formato: Nome: Valor Unidade</p>
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

              <div className="space-y-2">
                {results.map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                      r.status === 'normal' ? 'border-green-500/20 bg-green-500/5' :
                      r.status === 'high' ? 'border-red-500/20 bg-red-500/5' : 'border-blue-500/20 bg-blue-500/5'
                    }`}>
                    <div>
                      <span className="text-sm font-bold">{r.ptName}</span>
                      <span className="text-xs text-muted-foreground ml-2">Ref: {r.ref.min}–{r.ref.max} {r.ref.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{r.value}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'normal' ? 'bg-green-500/20 text-green-500' :
                        r.status === 'high' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {r.status === 'normal' ? '✓' : r.status === 'high' ? '↑' : '↓'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {report && (
                <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
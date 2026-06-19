import React, { useState, useRef } from 'react';
import { Copy, Printer, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ResultView({ currentSOAP, setView }) {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  const copyToClipboard = async () => {
    const raw = contentRef.current?.innerHTML || '';
    // Limpa classes do Tailwind e mantém apenas HTML semântico puro
    const cleanHtml = raw
      .replace(/\sclass="[^"]*"/g, '')
      .replace(/\sstyle="[^"]*"/g, '');
    const blob = new Blob([cleanHtml], { type: 'text/html' });
    const data = [new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([currentSOAP.soap_text], { type: 'text/plain' }) })];
    try {
      await navigator.clipboard.write(data);
    } catch {
      await navigator.clipboard.writeText(currentSOAP.soap_text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentSOAP) return null;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentSOAP.sector && <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">{currentSOAP.sector}</span>}
          {currentSOAP.patient_initials && <span className="text-sm font-bold">{currentSOAP.patient_initials}</span>}
          {currentSOAP.bed && <span className="text-xs text-muted-foreground">Leito {currentSOAP.bed}</span>}
          {currentSOAP.created_date && <span className="text-xs text-muted-foreground">{format(new Date(currentSOAP.created_date), "dd/MM/yyyy", { locale: ptBR })}</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={copyToClipboard} className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-accent transition-colors">
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={() => window.print()} className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-accent transition-colors">
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={contentRef} className="prose prose-sm dark:prose-invert max-w-none [&_code]:bg-amber-500/10 [&_code]:text-amber-600 [&_code]:dark:text-amber-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:font-bold [&_code]:before:content-none [&_code]:after:content-none">
        <ReactMarkdown>{currentSOAP.soap_text}</ReactMarkdown>
      </div>

      {currentSOAP.prescription && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">💊 Prescrição</h4>
          <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/50 rounded-xl p-3">{currentSOAP.prescription}</pre>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button onClick={() => setView('form')} className="flex-1 py-3 text-muted-foreground font-bold hover:text-primary transition-colors rounded-2xl border border-border text-sm">
          ← Voltar
        </button>
        <button onClick={copyToClipboard} className="flex-1 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
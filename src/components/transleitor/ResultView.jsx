import React, { useState } from 'react';
import { Copy, Printer, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ResultView({ currentSOAP, setView }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentSOAP.soap_text);
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

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{currentSOAP.soap_text}</ReactMarkdown>
      </div>

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
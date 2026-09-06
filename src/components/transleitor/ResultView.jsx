import React, { useState, useRef } from 'react';
import { Copy, Printer, CheckCircle2, Pencil, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PassagemVisita from './PassagemVisita';
import AccuracyRating from '@/components/monitoramento/AccuracyRating';

export default function ResultView({ currentSOAP, onUpdate, usageLogId, selectedLLMId = '', llmProviders = [] }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const contentRef = useRef(null);

  const copyToClipboard = () => {
    const raw = contentRef.current?.innerHTML || '';
    const cleanHtml = raw
      .replace(/\sclass="[^"]*"/g, '')
      .replace(/\sstyle="[^"]*"/g, '');

    const tmp = document.createElement('div');
    tmp.innerHTML = cleanHtml;
    tmp.style.position = 'fixed';
    tmp.style.left = '-9999px';
    tmp.style.top = '0';
    document.body.appendChild(tmp);

    const range = document.createRange();
    range.selectNodeContents(tmp);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    try {
      document.execCommand('copy');
    } catch {
      navigator.clipboard?.writeText(currentSOAP.soap_text);
    }

    sel.removeAllRanges();
    document.body.removeChild(tmp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEditing = () => {
    setEditText(currentSOAP.soap_text);
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    await onUpdate(currentSOAP.id, { soap_text: editText });
    setSaving(false);
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditText('');
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
          {editing ? (
            <>
              <button onClick={saveEdit} disabled={saving} className="p-2 rounded-xl text-green-500 hover:bg-green-500/10 transition-colors">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={cancelEdit} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs font-bold">
                ✕
              </button>
            </>
          ) : (
            <>
              <button onClick={startEditing} className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-accent transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={copyToClipboard} className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-accent transition-colors">
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={() => window.print()} className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-accent transition-colors">
                <Printer className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          rows={16}
          className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-y focus:outline-none focus:border-primary/50 transition-all font-mono"
        />
      ) : (
        <div ref={contentRef} className="prose prose-sm dark:prose-invert max-w-none [&_code]:bg-amber-500/10 [&_code]:text-amber-600 [&_code]:dark:text-amber-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:font-bold [&_code]:before:content-none [&_code]:after:content-none" dangerouslySetInnerHTML={{ __html: currentSOAP.soap_text }} />
      )}

      {currentSOAP.prescription && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">💊 Prescrição</h4>
          <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/50 rounded-xl p-3">{currentSOAP.prescription}</pre>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button onClick={copyToClipboard} className="flex-1 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>

      {usageLogId && (
        <div className="pt-3 border-t border-border">
          <AccuracyRating logId={usageLogId} />
        </div>
      )}

      <PassagemVisita currentSOAP={currentSOAP} selectedLLMId={selectedLLMId} llmProviders={llmProviders} />
    </div>
  );
}
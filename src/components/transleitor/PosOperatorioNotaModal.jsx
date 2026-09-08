import React from 'react';
import { X, Copy, Save, Plus, Trash2, CheckCircle2, Scissors } from 'lucide-react';

// Modal de nota de pós-operatório: texto completo editável, com ações de
// copiar (texto já editado), salvar, inserir na Descrição Clínica e excluir.
export default function PosOperatorioNotaModal({
  procedimento, fonte, texto, onChangeTexto, flash, salvando,
  onCopiar, onSalvar, onInserir, onExcluir, onClose,
}) {
  const flashLabel = flash === 'salvo' ? 'Registro salvo'
    : flash === 'inserido' ? 'Inserido na Descrição Clínica'
    : 'Copiado para a área de transferência';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden print-area">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-border flex-shrink-0">
          <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Scissors className="w-4 h-4 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Evolução de Pós-Operatório</p>
            <h2 className="text-sm font-extrabold truncate">{procedimento || 'Procedimento'}</h2>
          </div>
          {fonte && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 shrink-0 mt-1">
              {fonte}
            </span>
          )}
          <button onClick={onClose} title="Fechar"
            className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <textarea value={texto} onChange={e => onChangeTexto(e.target.value)}
            placeholder="Descrição cirúrgica completa..."
            className="w-full min-h-[260px] px-4 py-3 rounded-xl bg-muted border border-border text-sm leading-relaxed resize-y focus:outline-none focus:border-primary/50 transition-all" />
          {flash && (
            <p className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> {flashLabel}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap px-5 py-4 border-t border-border flex-shrink-0">
          <button onClick={onCopiar}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all btn-press">
            <Copy className="w-3.5 h-3.5" /> Copiar
          </button>
          <button onClick={onSalvar} disabled={salvando}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-primary hover:bg-accent transition-all disabled:opacity-40">
            <Save className="w-3.5 h-3.5" /> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={onInserir}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-primary hover:bg-accent transition-all">
            <Plus className="w-3.5 h-3.5" /> Inserir na Descrição Clínica
          </button>
          <button onClick={onExcluir}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-destructive hover:bg-destructive/10 transition-all">
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </button>
          <button onClick={onClose} className="ml-auto px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { X } from 'lucide-react';
import { SEVERITY_LABELS, SEVERITY_STYLES, STATUS_LABELS, VECTOR_LABELS } from '@/lib/securityConstants';

const ACTION_LABELS = {
  criado: 'Criado pela varredura', revisao: 'Enviado para revisão', corrigido: 'Marcado como corrigido',
  falso_positivo: 'Marcado como falso positivo', reaberto: 'Reaberto', excluido: 'Excluído',
};

// Modal de detalhe do achado: severidade, evidência, correção, trilha de auditoria e ações.
export default function FindingDetailModal({ finding, logs = [], onClose, onSetStatus, onDelete }) {
  if (!finding) return null;
  const trail = logs.filter(l => l.finding_id === finding.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[finding.severity] || ''}`}>
              {SEVERITY_LABELS[finding.severity] || finding.severity}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">{VECTOR_LABELS[finding.vector] || ''}</span>
            <span className="text-[10px] text-muted-foreground">· {STATUS_LABELS[finding.status] || finding.status}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted-foreground">×</button>
        </div>

        <h2 className="text-sm font-extrabold">{finding.title}</h2>

        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">🔍 Evidência</p>
          <p className="text-xs text-foreground/90">{finding.evidence || '—'}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">🛠️ Correção recomendada</p>
          <p className="text-xs text-foreground/90">{finding.fix || '—'}</p>
        </div>

        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">🕵️ Trilha de Auditoria</p>
          {trail.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Nenhum registro.</p>
          ) : (
            <ul className="space-y-1.5">
              {trail.map(l => (
                <li key={l.id} className="text-[11px] text-muted-foreground">
                  <span className="font-bold text-foreground/80">{l.created_date ? new Date(l.created_date).toLocaleString('pt-BR') : '—'}</span>
                  {' — '}{ACTION_LABELS[l.action] || l.action}
                  {l.old_status || l.new_status ? ` (${STATUS_LABELS[l.old_status] || l.old_status || '—'} → ${STATUS_LABELS[l.new_status] || l.new_status || '—'})` : ''}
                  {' — por '}{l.user_name || '—'}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {finding.status === 'aberto' && (
            <button onClick={() => onSetStatus(finding, 'revisao', 'revisao', 'Corrigir? — movido para revisão')}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all">
              Corrigir?
            </button>
          )}
          {(finding.status === 'aberto' || finding.status === 'revisao') && (
            <button onClick={() => onSetStatus(finding, 'corrigido', 'corrigido', '')}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all">
              Marcar corrigido
            </button>
          )}
          {(finding.status === 'aberto' || finding.status === 'revisao') && (
            <button onClick={() => onSetStatus(finding, 'falso_positivo', 'falso_positivo', '')}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-muted text-muted-foreground border border-border hover:bg-accent transition-all">
              Falso positivo
            </button>
          )}
          {(finding.status === 'corrigido' || finding.status === 'falso_positivo') && (
            <button onClick={() => onSetStatus(finding, 'aberto', 'reaberto', '')}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25 hover:bg-amber-500/20 transition-all">
              Reabrir
            </button>
          )}
          <button onClick={() => onDelete(finding)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive/20 transition-all">
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
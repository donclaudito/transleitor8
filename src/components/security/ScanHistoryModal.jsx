import React from 'react';

// Modal com o histórico de execuções da varredura de segurança.
export default function ScanHistoryModal({ runs = [], onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[80vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold">🕘 Histórico de Varreduras</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted-foreground">×</button>
        </div>
        {runs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma varredura registrada ainda.</p>
        ) : (
          <ul className="space-y-2">
            {runs.map(r => (
              <li key={r.id} className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs font-bold">
                  {r.created_date ? new Date(r.created_date).toLocaleString('pt-BR') : '—'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {r.total_findings ?? 0} achado(s) · {r.new_findings ?? 0} novo(s) ·
                  {' '}{r.summary?.criticos ?? 0} crítico(s) · {r.summary?.altos ?? 0} alto(s) ·
                  {' '}{((r.duration_ms ?? 0) / 1000).toFixed(1)}s
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
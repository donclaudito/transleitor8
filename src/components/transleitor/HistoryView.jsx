import React from 'react';
import { ClipboardList, ChevronRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoryView({ evolutions, onSelect, onDelete }) {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">Histórico</h2>
        {evolutions.length > 0 && <span className="text-xs text-muted-foreground">{evolutions.length} evoluções</span>}
      </div>

      {evolutions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma evolução registrada</p>
          <p className="text-xs mt-1">Crie sua primeira evolução no formulário</p>
        </div>
      ) : (
        <div className="space-y-3">
          {evolutions.map(ev => (
            <div key={ev.id} onClick={() => onSelect(ev)}
              className="glass-card rounded-2xl p-4 cursor-pointer group transition-all hover:border-primary/20 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm truncate">{ev.patient_initials || 'Paciente'}</span>
                  {ev.bed && <span className="text-xs text-muted-foreground">Leito {ev.bed}</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {ev.sector && <span>{ev.sector}</span>}
                  {ev.sector && <span>·</span>}
                  <span>{format(new Date(ev.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onDelete && (
                  <button onClick={e => { e.stopPropagation(); onDelete(ev.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/15 text-muted-foreground/30 hover:text-destructive transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ClipboardList, X, CalendarDays, Loader2 } from 'lucide-react';

const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export default function ConsultasPrevias({ patientInitials, onSelect, onClose }) {
  const { data: evolutions = [], isLoading } = useQuery({
    queryKey: ['evolutions'],
    queryFn: () => base44.entities.Evolution.list('-created_date', 50),
  });

  const initials = normalize(patientInitials);
  const matches = initials
    ? evolutions.filter(ev => normalize(ev.patient_initials) === initials)
    : [];

  const fmtDate = (d) => new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg max-h-[82vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" /> Consultas Prévias
              </h2>
              <p className="text-xs text-muted-foreground">
                {initials ? `Evoluções salvas do paciente ${patientInitials}` : 'Busca por iniciais do paciente'}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-xs">Carregando consultas...</p>
              </div>
            ) : !initials ? (
              <p className="text-xs text-muted-foreground text-center py-10">
                Preencha as iniciais do paciente no formulário para buscar o histórico.
              </p>
            ) : matches.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10">
                Nenhuma consulta prévia encontrada para estas iniciais.
              </p>
            ) : matches.map(ev => (
              <button key={ev.id} onClick={() => onSelect(ev.soap_text)}
                className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-all space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="font-semibold">{fmtDate(ev.created_date)}</span>
                  {ev.sector && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{ev.sector}</span>}
                </div>
                <p className="text-xs text-foreground/80 line-clamp-3">
                  {ev.clinical_description || (ev.soap_text || '').replace(/<[^>]*>/g, ' ')}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
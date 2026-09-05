import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, XCircle } from 'lucide-react';

const FLOW_LABELS = { evolucao: 'Evolução', imagem: 'Imagem Médica' };

export default function UsageTable({ logs }) {
  if (!logs.length) return null;
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-bold">Data</th>
              <th className="px-4 py-3 font-bold">Fluxo</th>
              <th className="px-4 py-3 font-bold">Modelo</th>
              <th className="px-4 py-3 font-bold">Tempo</th>
              <th className="px-4 py-3 font-bold">Tokens</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Nota</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                  {format(new Date(l.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </td>
                <td className="px-4 py-2.5 font-medium">{FLOW_LABELS[l.flow] || l.flow}</td>
                <td className="px-4 py-2.5">{l.model}</td>
                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{l.response_time_ms} ms</td>
                <td className="px-4 py-2.5 text-muted-foreground">{l.tokens ?? '—'}</td>
                <td className="px-4 py-2.5">
                  {l.status === 'erro'
                    ? <XCircle className="w-3.5 h-3.5 text-destructive" />
                    : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </td>
                <td className="px-4 py-2.5 font-bold">{l.accuracy_score ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, RotateCcw, Trash2 } from 'lucide-react';

// Painel de atendimentos por mês, agrupados por tipo de cirurgia.
// Navega entre meses (setas) e permite resetar (zerar) os atendimentos do mês exibido.
export default function AtendimentosMesPanel() {
  const queryClient = useQueryClient();
  const [offsetMes, setOffsetMes] = useState(0); // 0 = mês corrente; +1 = mês anterior
  const [confirmando, setConfirmando] = useState(false);

  const { data: atendimentos = [] } = useQuery({
    queryKey: ['atendimentos-mes'],
    queryFn: () => base44.entities.AtendimentoCirurgico.list('-created_date', 500),
  });

  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - offsetMes, 1);
  const fim = new Date(inicio);
  fim.setMonth(fim.getMonth() + 1);
  const rotuloMes = inicio
    .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    .replace('.', '');

  const doMes = atendimentos.filter(a => {
    const d = new Date(a.created_date);
    return d >= inicio && d < fim;
  });
  const contagem = doMes.reduce((acc, a) => {
    acc[a.procedimento] = (acc[a.procedimento] || 0) + 1;
    return acc;
  }, {});
  const linhas = Object.entries(contagem).sort((a, b) => b[1] - a[1]);

  // Zera os atendimentos do mês exibido (confirmação em dois cliques).
  const resetar = async () => {
    setConfirmando(false);
    try {
      await base44.entities.AtendimentoCirurgico.deleteMany({
        created_date: { $gte: inicio.toISOString(), $lt: fim.toISOString() },
      });
    } catch (_) { /* ignora — recarrega a lista real abaixo */ }
    queryClient.invalidateQueries({ queryKey: ['atendimentos-mes'] });
  };

  return (
    <div className="glass-card rounded-xl p-3 space-y-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Atendimentos</p>
        <div className="flex items-center gap-0.5">
          <button onClick={() => { setOffsetMes(o => o + 1); setConfirmando(false); }}
            title="Mês anterior" aria-label="Mês anterior"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-semibold text-muted-foreground w-12 text-center">{rotuloMes}</span>
          <button onClick={() => setOffsetMes(o => Math.max(0, o - 1))}
            title="Mês seguinte" aria-label="Mês seguinte" disabled={offsetMes === 0}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-30">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {confirmando ? (
            <button onClick={resetar} title="Confirmar reset do mês"
              className="p-1 rounded-md text-destructive bg-destructive/10 animate-pulse transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={() => { setConfirmando(true); setTimeout(() => setConfirmando(false), 3000); }}
              title="Resetar atendimentos do mês" aria-label="Resetar atendimentos do mês"
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <p data-testid="atendimentos-total" className="text-xl font-extrabold text-primary leading-none">{doMes.length}</p>
      {linhas.length > 0 ? (
        <div className="space-y-1 max-h-28 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-primary/35 [&::-webkit-scrollbar-thumb]:rounded-full">
          {linhas.map(([nome, n]) => (
            <div key={nome} className="flex items-center justify-between gap-1.5 text-[11px]">
              <span className="truncate text-muted-foreground" title={nome}>{nome}</span>
              <span className="font-bold text-foreground flex-shrink-0">{n}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Nenhum atendimento em {rotuloMes}.</p>
      )}
    </div>
  );
}
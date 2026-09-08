import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Painel de atendimentos do mês corrente, agrupados por tipo de cirurgia.
// Cada atendimento é registrado quando o médico salva a descrição cirúrgica.
export default function AtendimentosMesPanel() {
  const { data: atendimentos = [] } = useQuery({
    queryKey: ['atendimentos-mes'],
    queryFn: () => base44.entities.AtendimentoCirurgico.list('-created_date', 500),
  });

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const doMes = atendimentos.filter(a => new Date(a.created_date) >= inicioMes);
  const contagem = doMes.reduce((acc, a) => {
    acc[a.procedimento] = (acc[a.procedimento] || 0) + 1;
    return acc;
  }, {});
  const linhas = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  const rotuloMes = new Date()
    .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    .replace('.', '');

  return (
    <div className="glass-card rounded-xl p-3 space-y-2 flex-shrink-0">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Atendimentos</p>
        <span className="text-[10px] font-semibold text-muted-foreground">{rotuloMes}</span>
      </div>
      <p className="text-xl font-extrabold text-primary leading-none">{doMes.length}</p>
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
        <p className="text-[11px] text-muted-foreground">Nenhum atendimento salvo este mês.</p>
      )}
    </div>
  );
}
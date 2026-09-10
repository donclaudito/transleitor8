import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { FileSpreadsheet, X, Download, CalendarRange } from 'lucide-react';

// Exportação de atendimentos: botão flutuante das telas de ESPECIALIDADE que abre
// um modal com seleção de período e gera uma planilha CSV (abre no Excel/Sheets)
// com todos os registros de evolução do período — para controle financeiro e
// estatístico. Após exportar, volta ao Menu.
const hojeStr = () => new Date().toISOString().slice(0, 10);
const primeiroDiaMes = () => hojeStr().slice(0, 8) + '01';

const tipoDeAtendimento = (ev) => {
  const tipo = ev.form_data?.consultorioType;
  if (tipo === 'primeira_vez') return '1ª Consulta';
  if (tipo === 'retorno') return 'Retorno';
  return '—';
};

// CID-10 sugerido pela IA fica num bloco <code> da evolução.
const cidDe = (ev) => {
  const html = ev.soap_text || '';
  const tmp = document.createElement('div');
  const cids = [];
  const re = /<code[^>]*>([\s\S]*?)<\/code>/g;
  let m;
  while ((m = re.exec(html))) {
    if (!m[1].includes('CID-10')) continue;
    tmp.innerHTML = m[1];
    cids.push(tmp.textContent.replace(/^CID-10 sugerido:\s*/i, '').replace(/\s+/g, ' ').trim());
  }
  return cids.join(' | ');
};

const textoDe = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent.replace(/\n{3,}/g, '\n\n').trim();
};

const dataHora = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function ExportarEvolucoes() {
  const { user } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [inicio, setInicio] = useState(primeiroDiaMes());
  const [fim, setFim] = useState(hojeStr());

  const { data: minhas = [], isLoading } = useQuery({
    queryKey: ['evolutions-export', user?.id],
    queryFn: () => base44.entities.Evolution.filter({ created_by_id: user.id }),
    enabled: aberto && !!user,
  });

  const de = inicio ? new Date(inicio + 'T00:00:00') : null;
  const ate = fim ? new Date(fim + 'T23:59:59') : null;
  const periodoValido = inicio && fim && de <= ate;
  const doPeriodo = periodoValido
    ? minhas.filter(ev => {
        const d = new Date(ev.created_date);
        return d >= de && d <= ate;
      })
    : [];

  const exportar = () => {
    if (!periodoValido || doPeriodo.length === 0) return;
    const linhas = [
      ['Data', 'Setor', 'Leito/Sala', 'Iniciais do Paciente', 'Tipo de Atendimento', 'Comorbidades', 'CID-10', 'Evolução'],
      ...doPeriodo.map(ev => [
        dataHora(ev.created_date), ev.sector || '', ev.bed || '', ev.patient_initials || '',
        tipoDeAtendimento(ev), ev.comorbidities || '', cidDe(ev), textoDe(ev.soap_text),
      ]),
    ];
    const csv = '\uFEFF' + linhas.map(l => l.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atendimentos_${inicio}_a_${fim}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setAberto(false);
  };

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="Exportar atendimentos do período para planilha"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg btn-press hover:opacity-90 transition-all"
      >
        <FileSpreadsheet className="w-4 h-4" /> Exportar atendimentos
      </button>

      {aberto && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setAberto(false)}
        >
          <div
            className="w-full max-w-md glass-card rounded-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" /> Exportar atendimentos
              </h3>
              <button onClick={() => setAberto(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-2">
              Planilha com todos os atendimentos do período selecionado — controle financeiro e estatístico.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <CalendarRange className="w-3 h-3" /> De
                </label>
                <input type="date" value={inicio} onChange={e => setInicio(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Até</label>
                <input type="date" value={fim} onChange={e => setFim(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50" />
              </div>
            </div>

            {isLoading ? (
              <p className="text-[11px] text-muted-foreground">Carregando registros...</p>
            ) : !periodoValido ? (
              <p className="text-[11px] text-red-500">Período inválido — a data inicial deve ser anterior à final.</p>
            ) : doPeriodo.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Nenhum atendimento registrado neste período.</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                <strong className="text-primary">{doPeriodo.length}</strong> atendimento(s) no período.
              </p>
            )}

            <button
              onClick={exportar}
              disabled={!periodoValido || doPeriodo.length === 0}
              className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Gerar planilha
            </button>
            <p className="text-[10px] text-muted-foreground text-center -mt-2">
              A planilha é salva nos downloads — você continua nesta tela.
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
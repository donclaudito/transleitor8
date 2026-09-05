import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Loader2, ShieldAlert, Zap, Timer, Star, ShieldCheck } from 'lucide-react';
import UsageCharts from '@/components/monitoramento/UsageCharts';
import UsageTable from '@/components/monitoramento/UsageTable';

const FLOWS = [
  { id: 'todos', label: 'Todos os fluxos' },
  { id: 'evolucao', label: 'Evolução' },
  { id: 'imagem', label: 'Imagem Médica' },
];

const PERIODS = [
  { id: 'hoje', label: 'Hoje' },
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: 'todos', label: 'Todo o período' },
];

export default function Monitoramento() {
  const [flow, setFlow] = useState('todos');
  const [model, setModel] = useState('todos');
  const [period, setPeriod] = useState('30d');

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = !!user && user.role === 'admin';

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['llm-usage-logs'],
    queryFn: () => base44.entities.LLMUsageLog.list('-created_date', 500),
    enabled: isAdmin,
  });

  const models = useMemo(() => [...new Set(logs.map((l) => l.model))].sort(), [logs]);

  const filtered = useMemo(() => {
    let cutoff = null;
    if (period === 'hoje') cutoff = new Date().setHours(0, 0, 0, 0);
    else if (period === '7d') cutoff = Date.now() - 7 * 86400000;
    else if (period === '30d') cutoff = Date.now() - 30 * 86400000;

    return logs.filter((l) => {
      if (flow !== 'todos' && l.flow !== flow) return false;
      if (model !== 'todos' && l.model !== model) return false;
      if (cutoff && new Date(l.created_date).getTime() < cutoff) return false;
      return true;
    });
  }, [logs, flow, model, period]);

  const byModel = useMemo(() => {
    const map = {};
    filtered.forEach((l) => {
      const key = l.model || 'desconhecido';
      if (!map[key]) map[key] = { model: key, chamadas: 0, tokens: 0, tempoTotal: 0, notaTotal: 0, notas: 0 };
      const m = map[key];
      m.chamadas += 1;
      m.tokens += l.tokens || 0;
      m.tempoTotal += l.response_time_ms || 0;
      if (l.accuracy_score != null) {
        m.notaTotal += l.accuracy_score;
        m.notas += 1;
      }
    });
    return Object.values(map).map((m) => ({
      model: m.model,
      chamadas: m.chamadas,
      tokens: m.tokens,
      tempoMedio: m.chamadas ? Math.round(m.tempoTotal / m.chamadas) : 0,
      precisaoMedia: m.notas ? +(m.notaTotal / m.notas).toFixed(1) : 0,
    }));
  }, [filtered]);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-lg font-extrabold">Acesso Restrito</h1>
          <p className="text-sm text-muted-foreground max-w-xs">Apenas administradores podem acessar o monitoramento de IA.</p>
          <Link to="/transleitor" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Transleitor
          </Link>
        </div>
      </div>
    );
  }

  const totalChamadas = filtered.length;
  const tokensTotais = filtered.reduce((s, l) => s + (l.tokens || 0), 0);
  const tempoMedio = totalChamadas
    ? Math.round(filtered.reduce((s, l) => s + (l.response_time_ms || 0), 0) / totalChamadas)
    : 0;
  const avaliados = filtered.filter((l) => l.accuracy_score != null);
  const precisaoMedia = avaliados.length
    ? (avaliados.reduce((s, l) => s + l.accuracy_score, 0) / avaliados.length).toFixed(1)
    : '—';
  const erros = filtered.filter((l) => l.status === 'erro').length;

  const stats = [
    { icon: Activity, label: 'Chamadas', value: totalChamadas, color: 'text-primary' },
    { icon: Zap, label: 'Tokens consumidos', value: tokensTotais.toLocaleString('pt-BR'), color: 'text-amber-400' },
    { icon: Timer, label: 'Tempo médio', value: `${tempoMedio} ms`, color: 'text-cyan-400' },
    { icon: Star, label: 'Precisão média', value: precisaoMedia, color: 'text-emerald-400' },
    { icon: ShieldCheck, label: 'Erros', value: erros, color: erros ? 'text-destructive' : 'text-muted-foreground' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-6 py-4 flex items-center gap-4">
        <Link to="/transleitor" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Monitoramento de IA
          </h1>
          <p className="text-xs text-muted-foreground">Uso de tokens, tempo de resposta e precisão por modelo</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Filtros */}
        <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold uppercase text-muted-foreground">Fluxo</label>
            <select value={flow} onChange={(e) => setFlow(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-xs font-semibold focus:outline-none focus:border-primary/50">
              {FLOWS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold uppercase text-muted-foreground">Modelo</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-xs font-semibold focus:outline-none focus:border-primary/50">
              <option value="todos">Todos os modelos</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold uppercase text-muted-foreground">Período</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-xs font-semibold focus:outline-none focus:border-primary/50">
              {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : totalChamadas === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhum registro de uso</p>
            <p className="text-xs mt-1 max-w-xs">Gere evoluções ou analise imagens para começar a coletar dados de monitoramento.</p>
          </div>
        ) : (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {stats.map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                  </div>
                  <p className="text-xl font-extrabold">{value}</p>
                </div>
              ))}
            </div>

            <UsageCharts byModel={byModel} />

            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Últimos {Math.min(filtered.length, 50)} registros
              </h2>
              <UsageTable logs={filtered.slice(0, 50)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
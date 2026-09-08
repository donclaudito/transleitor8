import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { X, Plus, Trash2, Check, Scissors, Search, Zap, Sun, Moon } from 'lucide-react';
import PopProcedimento from './PopProcedimento';
import PopEvolucao from './PopEvolucao';
import DescricaoCirurgicaEditor from './DescricaoCirurgicaEditor';

const EM_BRANCO = { id: null, procedimento: '', evolucao: '', ap: null, resultado: '', fonte: '' };

const fmtDate = (d) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export default function SurgeryModule({ onClose, llmProviders = [], theme = 'dark', onToggleTheme = () => {} }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reg, setReg] = useState(EM_BRANCO);
  const [confirmId, setConfirmId] = useState(null);
  const [popA, setPopA] = useState(false);
  const [popB, setPopB] = useState(false);
  const [iaSelecionada, setIaSelecionada] = useState('base44'); // 'base44' | 'deepseek'
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [flash, setFlash] = useState(''); // 'copiado' | 'salvo'
  const [erro, setErro] = useState('');
  const [view, setView] = useState('descricao'); // 'descricao' (editor + preview) | 'evolucao' (cards + pops)

  // Barra lateral: registros do médico logado, mais recentes primeiro (escopo por dono no servidor).
  const { data: registros = [] } = useQuery({
    queryKey: ['evolucao-pos-operatoria', user?.id],
    queryFn: () => base44.entities.EvolucaoPosOperatoria.filter({ created_by_id: user.id }, '-created_date', 100),
    enabled: !!user,
  });
  const meus = registros.filter(r => user && r.created_by_id === user.id);

  // Pill DeepSeek: usa a lista de provedores já carregada pela página do Transleitor.
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const deepseekList = llmProviders.filter(p => norm(p.provider_name).includes('deepseek'));
  const deepseekId = (deepseekList.find(p => norm(p.provider_name).trim() === 'deepseek') || deepseekList[0])?.id || null;

  const atualizarCache = (fn) =>
    queryClient.setQueryData(['evolucao-pos-operatoria', user.id], (old = []) => fn(old));

  const novo = () => { setReg({ ...EM_BRANCO }); setErro(''); setFlash(''); };

  const abrir = (r) => {
    setReg({
      id: r.id,
      procedimento: r.procedimento || '',
      evolucao: r.evolucao || '',
      ap: r.ap_confirmado ?? null,
      resultado: r.resultado || '',
      fonte: r.fonte || '',
    });
    setErro('');
  };

  const salvar = async () => {
    if (!reg.procedimento.trim()) { setErro('Defina o procedimento cirúrgico antes de salvar (Card 1 → "Escolher procedimento").'); return; }
    setSalvando(true); setErro('');
    const dados = {
      procedimento: reg.procedimento.trim(),
      evolucao: reg.evolucao.trim(),
      ap_confirmado: reg.ap,
      encaminhado: true,
      resultado: reg.resultado,
      fonte: reg.fonte || '',
    };
    try {
      if (reg.id) {
        const upd = await base44.entities.EvolucaoPosOperatoria.update(reg.id, dados);
        atualizarCache(old => old.map(x => (x.id === reg.id ? upd : x)));
      } else {
        const criado = await base44.entities.EvolucaoPosOperatoria.create(dados);
        if (criado?.created_by_id === user.id) {
          atualizarCache(old => [criado, ...old]); // novo registro sobe para o topo da lateral
        } else {
          queryClient.invalidateQueries({ queryKey: ['evolucao-pos-operatoria', user.id] });
        }
        setReg(prev => ({ ...prev, id: criado.id }));
      }
      setFlash('salvo');
      setTimeout(() => setFlash(''), 1200);
    } catch (_) {
      setErro('Não foi possível salvar o registro. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirRegistro = async (r) => {
    setConfirmId(null);
    if (r.created_by_id !== user.id) return; // exclusão só de registros próprios
    atualizarCache(old => old.filter(x => x.id !== r.id));
    if (reg.id === r.id) novo();
    try {
      await base44.entities.EvolucaoPosOperatoria.delete(r.id);
    } catch (_) {
      queryClient.invalidateQueries({ queryKey: ['evolucao-pos-operatoria', user.id] });
    }
  };

  const gerar = async () => {
    if (!reg.procedimento.trim()) { setErro('Defina o procedimento cirúrgico primeiro (Card 1 → "Escolher procedimento").'); return; }
    if (!reg.evolucao.trim()) { setErro('Monte o contexto da evolução antes de gerar.'); return; }
    setGerando(true); setErro('');
    try {
      const res = await base44.functions.invoke('gerarEvolucaoPosOperatoria', {
        procedimento: reg.procedimento.trim(),
        contexto: reg.evolucao.trim(),
        ap: reg.ap === true,
        llm_config_id: iaSelecionada === 'deepseek' ? deepseekId : null,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setReg(prev => ({ ...prev, resultado: res.data.texto, fonte: res.data.provider || '' }));
    } catch (e) {
      let msg = e?.response?.data?.error || e?.message || 'Erro ao gerar a evolução.';
      if (iaSelecionada === 'base44' && deepseekId && /cr[eé]dito|limit|402/i.test(msg)) {
        // Créditos do Base44 esgotados: avisa para alternar o seletor — o texto digitado permanece no campo.
        msg = 'A IA do Base44 está sem créditos no momento. Alterne o seletor acima para "DeepSeek" e gere novamente — o texto que você digitou continua aqui, nada foi perdido.';
      }
      setErro(msg);
    } finally {
      setGerando(false);
    }
  };

  const copiarResultado = async () => {
    try {
      await navigator.clipboard.writeText(reg.resultado);
      setFlash('copiado');
      setTimeout(() => setFlash(''), 1200);
    } catch (_) {
      setErro('Não foi possível copiar para a área de transferência.');
    }
  };

  if (!user) return null;

  const apResumo = reg.ap === true ? 'Sim' : reg.ap === false ? 'Não' : '—';
  const iaResumo = iaSelecionada === 'deepseek' ? 'DeepSeek' : 'IA do Base44';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-6xl h-full max-h-[94vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Cabeçalho: abas + alternância de tema */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
            <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Scissors className="w-4 h-4 text-primary" />
            </span>
            <div className="hidden sm:block">
              <h2 className="text-sm font-extrabold">Módulo de Cirurgias</h2>
              <p className="text-[11px] text-muted-foreground">Procedimento cirúrgico e evolução de pós-operatório</p>
            </div>
            <div className="flex gap-1 bg-muted rounded-xl p-1 border border-border mx-auto sm:mx-4 flex-shrink-0">
              <button onClick={() => setView('descricao')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'descricao' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                }`}>
                Descrição da Cirurgia
              </button>
              <button onClick={() => setView('evolucao')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'evolucao' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                }`}>
                Evolução PO
              </button>
            </div>
            <button onClick={onToggleTheme} title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex-shrink-0">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {view === 'descricao' ? (
            <DescricaoCirurgicaEditor />
          ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            {/* Barra lateral: procedimentos salvos, rolagem própria */}
            <aside className="md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-border p-3 space-y-2 flex flex-col max-h-[32vh] md:max-h-none min-h-0">
              <button onClick={novo}
                className="flex-shrink-0 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all btn-press">
                <Plus className="w-3.5 h-3.5" /> Novo
              </button>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-primary/35 [&::-webkit-scrollbar-thumb]:rounded-full">
                {meus.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-4">
                    Nenhum registro salvo. Gere uma evolução e use "Salvar".
                  </p>
                )}
                {meus.map(r => (
                  <div key={r.id}
                    className={`rounded-xl border p-2.5 space-y-1 transition-all ${
                      reg.id === r.id ? 'border-primary/40 bg-primary/10' : 'border-border hover:border-primary/30'
                    }`}>
                    <button onClick={() => abrir(r)} className="w-full text-left space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-muted-foreground">{fmtDate(r.created_date)}</span>
                        {r.ap_confirmado === true && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-bold">AP</span>
                        )}
                      </div>
                      <p className="text-xs font-bold line-clamp-2">{r.procedimento}</p>
                    </button>
                    <div className="flex justify-end">
                      {confirmId === r.id ? (
                        <button onClick={() => excluirRegistro(r)} title="Confirmar exclusão"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-destructive hover:bg-destructive/10 transition-all">
                          <Check className="w-3 h-3" /> Confirmar exclusão
                        </button>
                      ) : (
                        <button onClick={() => { setConfirmId(r.id); setTimeout(() => setConfirmId(null), 3000); }}
                          title="Excluir registro"
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Área principal: duas ações independentes */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {/* Card 1 — Procedimento Cirúrgico */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1 · Procedimento Cirúrgico</h3>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Procedimento atual</p>
                  <p className={`text-sm font-bold mt-1 ${reg.procedimento ? '' : 'text-muted-foreground italic'}`}>
                    {reg.procedimento || 'não definido'}
                  </p>
                </div>
                <button onClick={() => setPopA(true)}
                  className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all btn-press">
                  <Search className="w-4 h-4" /> Escolher procedimento
                </button>
              </div>

              {/* Card 2 — Evolução de Pós-Operatório */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2 · Evolução de Pós-Operatório</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Procedimento: <span className="font-semibold text-foreground">{reg.procedimento || 'não definido'}</span></p>
                  <p>Confirmação AP: <span className="font-semibold text-foreground">{apResumo}</span></p>
                  <p>IA: <span className="font-semibold text-foreground">{iaResumo}</span></p>
                </div>
                <button onClick={() => setPopB(true)}
                  className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all btn-press">
                  <Zap className="w-4 h-4" /> Gerar/Revisar evolução
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* POP A e POP B são independentes: cada um abre/fecha pelo seu botão */}
      {popA && (
        <PopProcedimento
          onUsar={(nome) => setReg(prev => ({ ...prev, procedimento: nome }))}
          onClose={() => setPopA(false)}
        />
      )}
      {popB && (
        <PopEvolucao
          reg={reg}
          iaSelecionada={iaSelecionada}
          setIaSelecionada={setIaSelecionada}
          deepseekId={deepseekId}
          gerando={gerando}
          salvando={salvando}
          erro={erro}
          flash={flash}
          onGerar={gerar}
          onEditarContexto={(t) => setReg(prev => ({ ...prev, evolucao: t }))}
          onSetAp={(v) => setReg(prev => ({ ...prev, ap: v }))}
          onEditarResultado={(t) => setReg(prev => ({ ...prev, resultado: t }))}
          onCopiar={copiarResultado}
          onSalvar={salvar}
          onClose={() => setPopB(false)}
        />
      )}
    </div>
  );
}
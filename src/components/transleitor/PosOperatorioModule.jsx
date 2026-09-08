import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { X, Plus, Trash2, Check, Wand2, Save, Scissors, Loader2 } from 'lucide-react';
import SurgeryTemplates from './SurgeryTemplates';
import PosOperatorioNotaModal from './PosOperatorioNotaModal';

const EM_BRANCO = { id: null, procedimento: '', evolucao: '', ap_confirmado: null, encaminhado: true, resultado: '', fonte: '' };
const fmtDate = (d) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const appendTexto = (atual, texto) => {
  const base = (atual || '').trimEnd();
  if (!base) return texto;
  const ultimo = base.slice(-1);
  const sep = ['.', ';', '\n'].includes(ultimo) ? '\n' : '.\n';
  return base + sep + texto;
};

export default function PosOperatorioModule({ onClose, llmProviders = [] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reg, setReg] = useState(EM_BRANCO);
  const [confirmId, setConfirmId] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [iaSelecionada, setIaSelecionada] = useState('base44'); // 'base44' | 'deepseek'
  const [notaAberta, setNotaAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [flash, setFlash] = useState(''); // 'salvo' | 'copiado'
  const [erro, setErro] = useState('');

  // Barra lateral: registros do médico logado, mais recentes primeiro.
  // Escopo por dono no servidor + trava na renderização (regra do Prompt 32).
  const { data: registros = [] } = useQuery({
    queryKey: ['evolucao-pos-operatoria', user?.id],
    queryFn: () => base44.entities.EvolucaoPosOperatoria.filter({ created_by_id: user.id }, '-created_date', 100),
    enabled: !!user,
  });
  const meus = registros.filter(r => user && r.created_by_id === user.id);

  // Pill DeepSeek: usa a lista de provedores já carregada pela página do Transleitor
  // (a consulta começa no mount da página, então o id já está resolvido quando o médico gera).
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const deepseekList = llmProviders.filter(p => norm(p.provider_name).includes('deepseek'));
  const deepseekId = (deepseekList.find(p => norm(p.provider_name).trim() === 'deepseek') || deepseekList[0])?.id || null;

  const atualizarCache = (fn) =>
    queryClient.setQueryData(['evolucao-pos-operatoria', user.id], (old = []) => fn(old));

  const novo = () => { setReg({ ...EM_BRANCO }); setErro(''); setNotaAberta(false); };

  const abrir = (r) => {
    setReg({
      id: r.id,
      procedimento: r.procedimento || '',
      evolucao: r.evolucao || '',
      ap_confirmado: r.ap_confirmado ?? null,
      encaminhado: r.encaminhado ?? true,
      resultado: r.resultado || '',
      fonte: r.fonte || '',
    });
    setErro(''); setNotaAberta(false);
  };

  const salvar = async () => {
    if (!reg.procedimento.trim()) { setErro('Preencha o procedimento cirúrgico antes de salvar.'); return; }
    setSalvando(true); setErro('');
    const dados = {
      procedimento: reg.procedimento.trim(),
      evolucao: reg.evolucao.trim(),
      ap_confirmado: reg.ap_confirmado,
      encaminhado: reg.encaminhado,
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
          atualizarCache(old => [criado, ...old]); // novo registro sobe para o topo
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
    if (!reg.procedimento.trim() || !reg.evolucao.trim()) {
      setErro('Preencha o procedimento cirúrgico e a evolução de pós-operatório antes de gerar.');
      return;
    }
    setGerando(true); setErro('');
    try {
      const res = await base44.functions.invoke('gerarEvolucaoPosOperatoria', {
        procedimento: reg.procedimento.trim(),
        evolucao: reg.evolucao.trim(),
        encaminhado: reg.encaminhado,
        ap_confirmado: reg.ap_confirmado,
        llm_config_id: iaSelecionada === 'deepseek' ? deepseekId : null,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setReg(prev => ({ ...prev, resultado: res.data.text, fonte: res.data.fonte || '' }));
      setNotaAberta(true); // abre o modal com a descrição cirúrgica completa
    } catch (e) {
      let msg = e?.response?.data?.error || e?.message || 'Erro ao gerar a nota.';
      if (iaSelecionada === 'base44' && deepseekId && /cr[eé]dito|limit|402/i.test(msg)) {
        // Créditos do Base44 esgotados: avisa para alternar — não troca sozinho. O texto montado permanece nos campos.
        msg = 'A IA do Base44 está sem créditos no momento. Toque no pill "DeepSeek" ao lado e gere novamente — o texto que você montou continua aqui, nada foi perdido.';
      } else if (/Chave API não configurada/i.test(msg)) {
        msg += ' Cadastre a chave nos secrets do app (dashboard → variáveis de ambiente).';
      }
      setErro(msg);
    } finally {
      setGerando(false);
    }
  };

  const inserirNaDescricaoClinica = () => {
    window.dispatchEvent(new CustomEvent('transleitor:inserir-clinica', { detail: { texto: reg.resultado } }));
    setFlash('inserido');
    setTimeout(() => setFlash(''), 1600);
  };

  const excluirNota = () => {
    setReg(prev => ({ ...prev, resultado: '', fonte: '' }));
    setNotaAberta(false);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(reg.resultado);
      setFlash('copiado');
      setTimeout(() => setFlash(''), 1200);
    } catch (_) {
      setErro('Não foi possível copiar para a área de transferência.');
    }
  };

  const apBadge = (ap) => ap === true
    ? <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-bold">AP ✓</span>
    : ap === false
      ? <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[9px] font-bold">AP ✗</span>
      : <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[9px] font-bold">AP ?</span>;

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-5xl h-full max-h-[94vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Cabeçalho */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
            <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold">Evolução de Pós-Operatório</h2>
              <p className="text-[11px] text-muted-foreground">Registros salvos por você, de qualquer setor</p>
            </div>
            <button onClick={onClose} className="ml-auto p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            {/* Barra lateral de acesso rápido */}
            <aside className="md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-border overflow-y-auto p-3 space-y-2">
              <button onClick={novo}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all btn-press">
                <Plus className="w-3.5 h-3.5" /> Novo
              </button>
              {meus.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-4">
                  Nenhum registro salvo. Preencha o formulário e use "Salvar".
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
                      {apBadge(r.ap_confirmado)}
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
            </aside>

            {/* Conteúdo principal */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Procedimento Cirúrgico</h3>
                <textarea rows={2} placeholder="Ex.: Hernioplastia inguinal, Colecistectomia videolaparoscópica..."
                  value={reg.procedimento} onChange={e => setReg({ ...reg, procedimento: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all" />
              </div>

              <SurgeryTemplates onPaste={(texto) => setReg(prev => ({ ...prev, evolucao: appendTexto(prev.evolucao, texto) }))} />

              <div className="glass-card rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evolução de Pós-Operatório</h3>
                  <button onClick={salvar} disabled={salvando}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border text-primary hover:bg-accent transition-all disabled:opacity-40">
                    <Save className="w-3.5 h-3.5" /> {salvando ? 'Salvando...' : 'Salvar registro'}
                  </button>
                </div>
                <textarea rows={5} placeholder="Descreva o pós-operatório: queixas, sinais, aceitação de dieta, ferida, drenos..."
                  value={reg.evolucao} onChange={e => setReg({ ...reg, evolucao: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all" />

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={reg.encaminhado} onChange={e => setReg({ ...reg, encaminhado: e.target.checked })}
                      className="w-4 h-4 accent-[hsl(var(--primary))]" />
                    Encaminhado à sala de recuperação
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Confirmação AP:</span>
                    <div className="flex gap-1 bg-muted rounded-xl p-1">
                      <button onClick={() => setReg({ ...reg, ap_confirmado: true })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${reg.ap_confirmado === true ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
                        Sim
                      </button>
                      <button onClick={() => setReg({ ...reg, ap_confirmado: false })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${reg.ap_confirmado === false ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
                        Não
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gerar com:</span>
                  <button onClick={() => setIaSelecionada('base44')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${iaSelecionada === 'base44' ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                    IA do Base44
                  </button>
                  {deepseekId && (
                    <button onClick={() => setIaSelecionada('deepseek')} title="Usa a chave DeepSeek do app, sem consumir créditos do Base44"
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${iaSelecionada === 'deepseek' ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                      DeepSeek
                    </button>
                  )}
                </div>
                <button onClick={gerar} disabled={gerando}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg btn-press ${
                    gerando ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse' : 'bg-primary text-primary-foreground hover:opacity-90'
                  }`}>
                  {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {gerando ? 'Gerando nota de pós-operatório...' : 'Gerar evolução'}
                </button>
                {erro && <p className="text-xs text-destructive text-center">{erro}</p>}
              </div>

              {/* Nota gerada: reabrir o modal quando ele foi fechado */}
              {reg.resultado && !notaAberta && (
                <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nota de Pós-Operatório</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {reg.fonte ? `${reg.fonte} · ` : ''}{reg.resultado.length} caracteres — pronta para copiar ou inserir
                    </p>
                  </div>
                  <button onClick={() => setNotaAberta(true)}
                    className="flex-shrink-0 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all btn-press">
                    Abrir nota
                  </button>
                </div>
              )}

              {notaAberta && reg.resultado && (
                <PosOperatorioNotaModal
                  procedimento={reg.procedimento}
                  fonte={reg.fonte}
                  texto={reg.resultado}
                  onChangeTexto={(t) => setReg(prev => ({ ...prev, resultado: t }))}
                  flash={flash}
                  salvando={salvando}
                  onCopiar={copiar}
                  onSalvar={salvar}
                  onInserir={inserirNaDescricaoClinica}
                  onExcluir={excluirNota}
                  onClose={() => setNotaAberta(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
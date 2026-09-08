import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { X, Plus, Trash2, Check, Wand2, Copy, Pencil, Save, Printer, Scissors, Loader2, CheckCircle2 } from 'lucide-react';
import SurgeryTemplates from './SurgeryTemplates';

const EM_BRANCO = { id: null, procedimento: '', evolucao: '', ap_confirmado: null, encaminhado: true, resultado: '' };
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

export default function PosOperatorioModule({ onClose, selectedLLMId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reg, setReg] = useState(EM_BRANCO);
  const [confirmId, setConfirmId] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [editandoResultado, setEditandoResultado] = useState(false);
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

  const atualizarCache = (fn) =>
    queryClient.setQueryData(['evolucao-pos-operatoria', user.id], (old = []) => fn(old));

  const novo = () => { setReg({ ...EM_BRANCO }); setErro(''); setEditandoResultado(false); };

  const abrir = (r) => {
    setReg({
      id: r.id,
      procedimento: r.procedimento || '',
      evolucao: r.evolucao || '',
      ap_confirmado: r.ap_confirmado ?? null,
      encaminhado: r.encaminhado ?? true,
      resultado: r.resultado || '',
    });
    setErro(''); setEditandoResultado(false);
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
    const ap = reg.ap_confirmado === true ? 'AP confirmado (Sim)'
      : reg.ap_confirmado === false ? 'AP ainda não confirmado (Não)'
        : 'Confirmação de AP pendente';
    const prompt = `Você é um assistente médico especialista em cirurgia geral e documentação clínica brasileira.
Gere a nota de pós-operatório em HTML semântico (sem Markdown), técnica e pronta para prontuário. NÃO invente dados.

DADOS DO CASO:
- Procedimento cirúrgico: ${reg.procedimento.trim()}
- Evolução de pós-operatório descrita pelo médico: ${reg.evolucao.trim()}
- Encaminhamento: ${reg.encaminhado ? 'Paciente encaminhado à sala de recuperação pós-anestésica.' : 'Sem registro de encaminhamento à sala de recuperação.'}
- Confirmação de anatomopatológico (AP): ${ap}

REGRAS (OBRIGATÓRIAS):
1. Use exclusivamente os dados acima — são a única fonte permitida. NÃO invente exames, sinais vitais, medicamentos ou achados.
2. Seção sem dados correspondentes fica vazia ou é omitida — nunca escreva "(dados não fornecidos)".
3. Redija como um médico brasileiro escreve um prontuário real: terminologia médica formal, fraseado natural. NUNCA mencione "IA", "dados fornecidos" ou "instruções".

Estruture: identificação do procedimento e estado atual do paciente, condutas, e encaminhamento. Inclua a linha de encaminhamento à sala de recuperação quando indicado e a situação do AP (confirmado, não confirmado ou pendente).
Use <p>, <strong>, <ul>/<li>. NÃO use Markdown.`;
    try {
      let resultado;
      if (selectedLLMId) {
        const res = await base44.functions.invoke('generateSOAP', { prompt, llm_config_id: selectedLLMId });
        if (res.data?.error) throw new Error(res.data.error);
        resultado = res.data.text;
      } else {
        resultado = await base44.integrations.Core.InvokeLLM({ prompt, model: 'gemini_3_flash' });
      }
      setReg(prev => ({ ...prev, resultado }));
      setEditandoResultado(false);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Erro ao gerar a evolução.';
      setErro(msg);
    } finally {
      setGerando(false);
    }
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

              <button onClick={gerar} disabled={gerando}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg btn-press ${
                  gerando ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse' : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}>
                {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {gerando ? 'Gerando nota de pós-operatório...' : 'Gerar evolução'}
              </button>
              {erro && <p className="text-xs text-destructive text-center">{erro}</p>}

              {/* Resultado */}
              {reg.resultado && (
                <div className="glass-card rounded-2xl p-5 space-y-3 print-area">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nota de Pós-Operatório</h3>
                    <div className="flex items-center gap-1.5">
                      {flash && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                          <CheckCircle2 className="w-3 h-3" /> {flash === 'salvo' ? 'Salvo' : 'Copiado'}
                        </span>
                      )}
                      {editandoResultado ? (
                        <>
                          <button onClick={() => setEditandoResultado(false)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border text-muted-foreground hover:bg-accent transition-all">
                            Cancelar edição
                          </button>
                          <button onClick={salvar} disabled={salvando}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all">
                            <Save className="w-3 h-3" /> {salvando ? 'Salvando...' : 'Salvar'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditandoResultado(true)} title="Editar resultado"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border text-muted-foreground hover:text-primary hover:bg-accent transition-all">
                            <Pencil className="w-3 h-3" /> Editar
                          </button>
                          <button onClick={salvar} disabled={salvando} title="Salvar registro na barra lateral"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all">
                            <Save className="w-3 h-3" /> {salvando ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button onClick={copiar} title="Copiar resultado"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-all">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setReg(prev => ({ ...prev, resultado: '' }))} title="Descartar resultado"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => window.print()} title="Imprimir"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-all">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {editandoResultado ? (
                    <textarea rows={10} value={reg.resultado} onChange={e => setReg({ ...reg, resultado: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-xs font-mono resize-none focus:outline-none focus:border-primary/50 transition-all" />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&_code]:bg-primary/10 [&_code]:text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:font-bold"
                      dangerouslySetInnerHTML={{ __html: reg.resultado }} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
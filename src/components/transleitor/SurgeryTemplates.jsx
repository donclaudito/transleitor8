import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ClipboardList, ClipboardPaste, ChevronDown, Plus, Copy, Pencil, Trash2, Check, Save, X } from 'lucide-react';

const EM_BRANCO = { id: null, nome: '', texto: '' };

export default function SurgeryTemplates({ onPaste }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editor, setEditor] = useState(null); // EM_BRANCO (novo) ou template em edição
  const [confirmId, setConfirmId] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const [copiadoId, setCopiadoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Isolamento por médico (regra do Prompt 32): consulta escopada ao dono
  // + trava na renderização — admin não vê templates de outros no formulário.
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates-evolucao', user?.id],
    queryFn: () => base44.entities.TemplateEvolucao.filter({ created_by_id: user.id }),
    enabled: !!user,
    staleTime: Infinity,
  });
  const meus = templates.filter(t => user && t.created_by_id === user.id);

  const atualizarCache = (fn) =>
    queryClient.setQueryData(['templates-evolucao', user.id], (old = []) => fn(old));

  const salvar = async () => {
    if (!editor.nome.trim() || !editor.texto.trim()) return;
    setSalvando(true); setErro('');
    try {
      const dados = { nome: editor.nome.trim(), texto: editor.texto.trim() };
      if (editor.id) {
        const reg = await base44.entities.TemplateEvolucao.update(editor.id, dados);
        atualizarCache(old => old.map(t => (t.id === editor.id ? reg : t)));
      } else {
        const reg = await base44.entities.TemplateEvolucao.create(dados);
        // Regra dura: só entra na lista se o dono for o médico logado.
        if (reg?.created_by_id === user.id) {
          atualizarCache(old => [...old, reg]);
        } else {
          queryClient.invalidateQueries({ queryKey: ['templates-evolucao', user.id] });
        }
      }
      setEditor(null);
    } catch (_) {
      setErro('Não foi possível salvar o template. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const colar = (t) => {
    onPaste(t.texto);
    setFlashId(t.id);
    setTimeout(() => setFlashId(null), 800);
  };

  const copiar = async (t) => {
    try {
      await navigator.clipboard.writeText(t.texto);
      setCopiadoId(t.id);
      setTimeout(() => setCopiadoId(null), 1200);
    } catch (_) {
      setErro('Não foi possível copiar para a área de transferência.');
    }
  };

  const excluir = async (t) => {
    setConfirmId(null);
    if (t.created_by_id !== user.id) return; // exclusão só de templates próprios
    atualizarCache(old => old.filter(x => x.id !== t.id));
    try {
      await base44.entities.TemplateEvolucao.delete(t.id);
    } catch (_) {
      queryClient.invalidateQueries({ queryKey: ['templates-evolucao', user.id] });
    }
  };

  if (!user) return null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => { setErro(''); setOpen(!open); }}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" /> Templates de Evolução
          {meus.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold normal-case tracking-normal">
              {meus.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={() => { setErro(''); setEditor({ ...EM_BRANCO }); }}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border text-primary hover:bg-accent transition-all">
          <Plus className="w-3.5 h-3.5" /> Novo template
        </button>
      </div>

      {open && (
        <>
          {editor && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
              <p className="text-[11px] font-semibold text-primary">
                {editor.id ? 'Editar template' : 'Novo template'}
              </p>
              <input value={editor.nome} onChange={e => setEditor({ ...editor, nome: e.target.value })}
                placeholder="Nome (ex.: PO uncomplicado)"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
              <textarea rows={4} value={editor.texto} onChange={e => setEditor({ ...editor, texto: e.target.value })}
                placeholder="Cole aqui o texto da evolução..."
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all" />
              {erro && <p className="text-red-500 text-[11px]">{erro}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditor(null)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:bg-accent transition-all">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button onClick={salvar} disabled={!editor.nome.trim() || !editor.texto.trim() || salvando}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all">
                  <Save className="w-3.5 h-3.5" /> {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="text-[11px] text-muted-foreground">Carregando templates...</p>
          ) : meus.length === 0 && !editor ? (
            <p className="text-[11px] text-muted-foreground">
              Nenhum template ainda. Crie o primeiro com "Novo template".
            </p>
          ) : (
            <div className="space-y-2">
              {meus.map(t => (
                <div key={t.id}
                  className={`rounded-xl border p-3 space-y-2 transition-all ${
                    flashId === t.id ? 'bg-primary/15 border-primary/40' : 'border-border hover:border-primary/30'
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold flex-1">{t.nome}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => colar(t)} title="Colar na Descrição Clínica"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all">
                        <ClipboardPaste className="w-3 h-3" /> Colar na Descrição
                      </button>
                      <button onClick={() => copiar(t)} title={copiadoId === t.id ? 'Copiado!' : 'Copiar'}
                        className={`p-1.5 rounded-lg transition-all ${copiadoId === t.id ? 'text-emerald-500' : 'text-muted-foreground hover:text-primary hover:bg-accent'}`}>
                        {copiadoId === t.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { setErro(''); setEditor({ id: t.id, nome: t.nome, texto: t.texto }); }}
                        title="Editar template"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmId === t.id ? (
                        <button onClick={() => excluir(t)} title="Confirmar exclusão"
                          className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => { setConfirmId(t.id); setTimeout(() => setConfirmId(null), 3000); }}
                          title="Excluir template"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 whitespace-pre-wrap">{t.texto}</p>
                  {confirmId === t.id && (
                    <p className="text-[11px] text-destructive">Clique no check para confirmar a exclusão.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
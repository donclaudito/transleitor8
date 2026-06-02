import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Save, X, ExternalLink, ToggleLeft, ToggleRight, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIAS = ['Produtividade', 'Comunicação', 'Desenvolvimento', 'Gestão', 'Saúde', 'Geral'];
const ICONES = ['🔗', '🚀', '⚡', '🛠️', '📊', '💬', '📁', '🎯', '🔍', '📋', '🌐', '💡', '🔐', '📱', '🩺', '💊', '🏥', '📈'];
const FORM_INIT = { nome: '', url: '', icone: '🔗', categoria: 'Geral', ativo: true, ordem: 0 };

export default function GerenciarApps() {
  const [form, setForm] = useState(FORM_INIT);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['applinks-all'],
    queryFn: () => base44.entities?.AppLink ? base44.entities.AppLink.list('ordem', 100) : Promise.resolve([]),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AppLink.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['applinks-all'] }); cancel(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AppLink.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['applinks-all'] }); cancel(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AppLink.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applinks-all'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome || !form.url) return;
    const url = form.url.startsWith('http') ? form.url : `https://${form.url}`;
    const data = { ...form, url };
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate({ ...data, ordem: links.length });
  };

  const handleEdit = (link) => {
    setForm({ nome: link.nome, url: link.url, icone: link.icone || '🔗', categoria: link.categoria || 'Geral', ativo: link.ativo ?? true, ordem: link.ordem || 0 });
    setEditingId(link.id);
    setShowForm(true);
  };

  const cancel = () => { setForm(FORM_INIT); setEditingId(null); setShowForm(false); };
  const toggleAtivo = (link) => updateMutation.mutate({ id: link.id, data: { ativo: !link.ativo } });
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-6 py-4 flex items-center gap-4">
        <Link to="/transleitor" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold">Gerenciar Apps</h1>
          <p className="text-xs text-muted-foreground">Links que aparecem no menu do header</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            <Plus className="w-4 h-4" /> Novo App
          </button>
        )}
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="font-bold">{editingId ? '✏️ Editar App' : '➕ Novo App'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Nome *</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50" required />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">URL *</label>
                <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50" required />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Categoria</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50">
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Ícone</label>
                <div className="flex flex-wrap gap-1.5">
                  {ICONES.map(ic => (
                    <button key={ic} type="button" onClick={() => setForm({ ...form, icone: ic })}
                      className={`w-9 h-9 rounded-lg text-base flex items-center justify-center transition-all ${form.icone === ic ? 'bg-primary/20 ring-2 ring-primary/50' : 'bg-muted hover:bg-accent'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isSaving} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" onClick={cancel} className="px-6 py-3 rounded-xl border border-border text-muted-foreground font-bold text-sm">Cancelar</button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
        ) : links.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-3xl mb-3">🔗</p>
            <p className="font-medium">Nenhum app cadastrado</p>
            <p className="text-xs mt-1">Clique em "Novo App" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map(link => (
              <div key={link.id} className="glass-card rounded-2xl px-5 py-4 flex items-center gap-4 group">
                <span className="text-2xl">{link.icone || '🔗'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${!link.ativo ? 'opacity-40' : ''}`}>{link.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">{link.categoria || 'Geral'}</span>
                <button onClick={() => toggleAtivo(link)} title={link.ativo ? 'Desativar' : 'Ativar'} className="text-muted-foreground hover:text-primary transition-colors">
                  {link.ativo ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => handleEdit(link)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMutation.mutate(link.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
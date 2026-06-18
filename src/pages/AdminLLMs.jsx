import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Power, PowerOff, Cpu, Key, Globe, Zap, Loader2 } from 'lucide-react';

export default function AdminLLMs() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ provider_name: '', api_url: '', api_key_env_var: '', model_name: '', is_active: true });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['llm-configs'],
    queryFn: () => base44.entities.LLMConfig.list('-created_date', 50),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LLMConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-configs'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LLMConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-configs'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LLMConfig.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['llm-configs'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.LLMConfig.update(id, { is_active: !is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['llm-configs'] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ provider_name: '', api_url: '', api_key_env_var: '', model_name: '', is_active: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.provider_name.trim() || !form.api_url.trim() || !form.api_key_env_var.trim() || !form.model_name.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setForm({ provider_name: p.provider_name, api_url: p.api_url, api_key_env_var: p.api_key_env_var, model_name: p.model_name, is_active: p.is_active });
    setShowForm(true);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Key className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-lg font-extrabold">Acesso Restrito</h1>
          <p className="text-sm text-muted-foreground max-w-xs">Apenas administradores podem gerenciar provedores de IA.</p>
          <Link to="/transleitor" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Transleitor
          </Link>
        </div>
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-6 py-4 flex items-center gap-4">
        <Link to="/transleitor" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" /> Provedores de IA
          </h1>
          <p className="text-xs text-muted-foreground">Configure APIs externas para geração de evoluções SOAP</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            showForm ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}>
          <Plus className="w-4 h-4" /> Novo
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Formulário */}
        {showForm && (
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-sm">{editingId ? 'Editar' : 'Novo'} Provedor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Nome do Provedor</label>
                <input value={form.provider_name} onChange={e => setForm({ ...form, provider_name: e.target.value })}
                  placeholder="Ex: Magistral, DeepSeek"
                  className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Nome do Modelo</label>
                <input value={form.model_name} onChange={e => setForm({ ...form, model_name: e.target.value })}
                  placeholder="Ex: magistral-v1-pro"
                  className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> URL da API (chat completions)
                </label>
                <input value={form.api_url} onChange={e => setForm({ ...form, api_url: e.target.value })}
                  placeholder="https://api.exemplo.com/v1/chat/completions"
                  className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 font-mono" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Key className="w-3 h-3" /> Nome da Variável de Ambiente (chave API)
                </label>
                <input value={form.api_key_env_var} onChange={e => setForm({ ...form, api_key_env_var: e.target.value })}
                  placeholder="Ex: MAGISTRAL_API_KEY"
                  className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 font-mono" />
                <p className="text-[11px] text-muted-foreground">
                  Configure o valor real em Dashboard → Configurações → Variáveis de Ambiente
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {editingId ? 'Salvar Alterações' : 'Cadastrar Provedor'}
              </button>
              <button type="button" onClick={resetForm}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Dica */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Key className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-400 mb-1">Configuração das Chaves API</p>
            <p className="text-xs text-amber-500/80">
              Após cadastrar um provedor, acesse o Dashboard do Base44 → Configurações → Variáveis de Ambiente
              e crie uma variável com exatamente o mesmo nome informado no campo acima. O valor deve ser a chave API secreta.
            </p>
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Cpu className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhum provedor cadastrado</p>
            <p className="text-xs mt-1 max-w-xs">Adicione provedores externos de IA para usar na geração de evoluções SOAP</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {providers.length} provedor(es) cadastrado(s)
            </h2>
            {providers.map((p) => (
              <div key={p.id} className={`glass-card rounded-2xl p-5 flex items-center gap-4 transition-all ${
                !p.is_active ? 'opacity-50' : ''
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  p.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{p.provider_name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{p.model_name}</p>
                  <p className="text-[10px] text-muted-foreground/60 truncate font-mono">{p.api_url}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(p)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-xs">
                    Editar
                  </button>
                  <button onClick={() => toggleMutation.mutate({ id: p.id, is_active: p.is_active })}
                    title={p.is_active ? 'Desativar' : 'Ativar'}
                    className={`p-2 rounded-lg transition-all ${
                      p.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-muted-foreground hover:bg-accent'
                    }`}>
                    {p.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { if (confirm(`Remover "${p.provider_name}"?`)) deleteMutation.mutate(p.id); }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
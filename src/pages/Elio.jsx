import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, Zap, Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ElioChat from '@/components/elio/ElioChat';
import ElioModelSelector from '@/components/elio/ElioModelSelector';
import ElioSidebar from '@/components/elio/ElioSidebar';

const STORAGE_KEY = 'elvio_selected_llm_id';

export default function Elio() {
  const navigate = useNavigate();
  // Seta volta SEMPRE à tela exata de onde a Elvira foi aberta (ex.: Gastro/Endoscopia),
  // registrada pelo cabeçalho ao abrir; se aberta direto, cai no Menu.
  // Volta à tela exata de onde a Elvira foi aberta nesta sessão; sem origem na sessão,
  // usa o contexto gravado na própria conversa (onde a consulta foi iniciada).
  const voltar = () => {
    let origem = null;
    try { origem = sessionStorage.getItem('elvira_origem'); sessionStorage.removeItem('elvira_origem'); } catch { /* best-effort */ }
    if (!origem) {
      const conv = conversas.find(c => c.id === activeConversationId);
      origem = conv?.metadata?.origem || null;
    }
    navigate(origem || '/menu');
  };
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [selectedLLMId, setSelectedLLMId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
  });

  const { data: llmProviders = [] } = useQuery({
    queryKey: ['llm-providers'],
    queryFn: async () => (await base44.functions.invoke('listLLMProviders', {})).data?.providers ?? [],
  });

  // Conversas do agente: retoma o contexto de origem de cada atendimento no botão voltar.
  const { data: conversas = [] } = useQuery({
    queryKey: ['elio-conversations'],
    queryFn: async () => {
      const list = await base44.agents.listConversations({ agent_name: 'elio' });
      return Array.isArray(list) ? list : (list?.conversations || []);
    },
  });

  const selectedProvider = llmProviders.find(p => p.id === selectedLLMId);

  const changeLLM = (id) => {
    setSelectedLLMId(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* persistência best-effort */ }
    setActiveConversationId(null); // trocar de modelo inicia nova conversa
  };

  const handleCreated = (id) => setActiveConversationId(id);

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Retomar conversa do agente Elvira: se um provedor externo estava ativo, volta ao modo padrão
  const handleSelectConversation = (id) => {
    if (selectedLLMId) {
      setSelectedLLMId('');
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* best-effort */ }
    }
    setActiveConversationId(id);
    setDrawerOpen(false);
  };
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setDrawerOpen(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={voltar} title="Voltar" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={() => setDrawerOpen(true)} title="Conversas"
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <Menu className="w-4 h-4" />
        </button>
        <div className="w-9 h-9 rounded-xl premium-gradient text-primary-foreground flex items-center justify-center shadow-lg flex-shrink-0">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-extrabold leading-tight">Elvira</h1>
          <p className="text-[11px] text-muted-foreground -mt-0.5">Assistente clínica</p>
        </div>
        <ElioModelSelector providers={llmProviders} selectedId={selectedLLMId} onSelect={changeLLM} />
      </header>

      {selectedProvider && (
        <div className="px-4 pt-2">
          <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 max-w-3xl mx-auto w-full">
            <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Elvira respondendo com: <span className="text-primary">{selectedProvider.provider_name}</span></span>
            <span className="font-normal text-muted-foreground/70 hidden sm:inline">— conversa local desta sessão, sem histórico salvo</span>
          </p>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Barra lateral de conversas — sempre visível no desktop */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-card/50">
          <ElioSidebar activeConversationId={activeConversationId} onNew={handleNewConversation} onSelect={handleSelectConversation} />
        </aside>

        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          <ElioChat conversationId={activeConversationId} onConversationCreated={handleCreated} selectedLLMId={selectedLLMId} />
        </main>

        {/* Gaveta de conversas no tablet/celular */}
        {drawerOpen && (
          <>
            <div className="fixed inset-0 z-[45] bg-black/40 lg:hidden" onClick={() => setDrawerOpen(false)} />
            <aside className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-card border-r border-border flex flex-col lg:hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conversas</span>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ElioSidebar activeConversationId={activeConversationId} onNew={handleNewConversation} onSelect={handleSelectConversation} />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
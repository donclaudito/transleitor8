import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ElioChat from '@/components/elio/ElioChat';
import ElioModelSelector from '@/components/elio/ElioModelSelector';

const STORAGE_KEY = 'elvio_selected_llm_id';

export default function Elio() {
  const navigate = useNavigate();
  // Seta volta SEMPRE à tela exata de onde a Elvira foi aberta (ex.: Gastro/Endoscopia),
  // registrada pelo cabeçalho ao abrir; se aberta direto, cai no Menu.
  const voltar = () => {
    let origem = null;
    try { origem = sessionStorage.getItem('elvira_origem'); sessionStorage.removeItem('elvira_origem'); } catch { /* best-effort */ }
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={voltar} title="Voltar" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-primary" />
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

      <main className="flex-1 flex flex-col min-w-0">
        <ElioChat conversationId={activeConversationId} onConversationCreated={handleCreated} selectedLLMId={selectedLLMId} />
      </main>
    </div>
  );
}
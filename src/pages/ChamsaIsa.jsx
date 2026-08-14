import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Plus, MessageSquare, Trash2, ArrowLeft, Loader2, Stethoscope } from 'lucide-react';
import MessageBubble from '@/components/chamsa/MessageBubble';

const AGENT_NAME = 'chamsa_isa';

function ConversationItem({ conv, active, onSelect, onDelete }) {
  const title = conv.metadata?.name || 'Nova conversa';
  return (
    <div
      onClick={() => onSelect(conv.id)}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
        active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'
      }`}
    >
      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={`flex-1 truncate text-xs font-medium ${active ? 'text-primary' : 'text-foreground/80'}`}>{title}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ChamsaIsa() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollRef = useRef(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['chamsa-conversations'],
    queryFn: async () => {
      const list = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      return list || [];
    },
  });

  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const loadConversation = useCallback(async (id) => {
    if (!id) return;
    try {
      const conv = await base44.agents.getConversation(id);
      setMessages(conv.messages || []);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (activeId) loadConversation(activeId);
  }, [activeId, loadConversation]);

  useEffect(() => {
    if (!activeId) return;
    const unsubscribe = base44.agents.subscribeToConversation(activeId, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: `Visita ${new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` },
      });
      await queryClient.invalidateQueries({ queryKey: ['chamsa-conversations'] });
      setActiveId(conv.id);
      setMessages([]);
      setShowSidebar(false);
    } catch (err) {
      alert('Erro ao criar conversa: ' + (err?.message || 'erro desconhecido'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.agents.deleteConversation?.(id);
      await queryClient.invalidateQueries({ queryKey: ['chamsa-conversations'] });
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch {
      // delete may not be available; ignore
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    if (!activeId) {
      await handleNewConversation();
    }

    const text = input.trim();
    setInput('');
    setSending(true);

    try {
      const conv = activeId
        ? await base44.agents.getConversation(activeId)
        : await base44.agents.createConversation({
            agent_name: AGENT_NAME,
            metadata: { name: `Visita ${new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` },
          });

      if (!activeId) {
        setActiveId(conv.id);
        await queryClient.invalidateQueries({ queryKey: ['chamsa-conversations'] });
      }

      await base44.agents.addMessage(conv, { role: 'user', content: text });
      // subscription will update messages
    } catch (err) {
      alert('Erro ao enviar: ' + (err?.message || 'erro desconhecido'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 glass border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          {showSidebar ? <ArrowLeft className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-violet-500/20 flex items-center justify-center border border-teal-500/20">
          <Stethoscope className="w-4.5 h-4.5 text-teal-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">Chamsa Isa</h1>
          <p className="text-[11px] text-muted-foreground truncate">Assistente Cirúrgica · Dr. Claudio</p>
        </div>
        <button
          onClick={handleNewConversation}
          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Nova
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`${showSidebar ? 'flex' : 'hidden'} lg:flex flex-col w-72 border-r border-border bg-card/30 overflow-y-auto p-3 space-y-1.5`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">Conversas</p>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 px-3">Nenhuma conversa. Toque em <strong>Nova</strong> para iniciar uma visita.</p>
          ) : (
            conversations.map((c) => (
              <ConversationItem key={c.id} conv={c} active={c.id === activeId} onSelect={setActiveId} onDelete={handleDelete} />
            ))
          )}
        </aside>

        {/* Chat */}
        <main className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/15 to-violet-500/15 flex items-center justify-center mb-4 border border-teal-500/20">
                  <Stethoscope className="w-7 h-7 text-teal-500" />
                </div>
                <h2 className="text-base font-bold mb-1">Olá, Dr. Claudio 👋</h2>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  Sou a <strong className="text-foreground">Chamsa Isa</strong>, sua assistente cirúrgica. Envie anotações rápidas da visita de leito (mobile) ou os dados complementares para a evolução final (desktop).
                </p>
              </div>
            ) : (
              messages.map((m, i) => <MessageBubble key={i} message={m} />)
            )}
            {sending && (
              <div className="flex justify-start gap-2.5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/20 to-violet-500/20 flex items-center justify-center border border-teal-500/20">
                  <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm glass-card text-sm text-muted-foreground">
                  Processando...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 bg-card/30">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Anotações da visita ou dados para evolução..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all max-h-32 leading-relaxed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="flex-shrink-0 w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-all btn-press"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Enter envia · Shift+Enter quebra linha</p>
          </div>
        </main>
      </div>
    </div>
  );
}
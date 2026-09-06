import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, ShieldAlert } from 'lucide-react';
import MessageBubble from '@/components/elio/MessageBubble';

const SUGGESTIONS = [
  'Faça uma auditoria Red Team das configurações do app',
  'Faça uma auditoria Blue Team das permissões e do RLS das entidades clínicas',
  'Revise os provedores de IA (LLMConfig) em busca de exposição de chaves',
  'Revise os links do app (AppLink) em busca de URLs inseguras',
];

// Chat com o Agente de Segurança (security_auditor): auditoria Red/Blue Team,
// registro de achados com permissão e correção sempre autorizada pelo admin.
export default function SecurityAgentChat() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    setMessages([]);
    setLoading(true);
    // Segurança: se nenhuma mensagem terminal chegar em 90s, desbloqueia o loading.
    let hangTimer = setTimeout(() => setLoading(false), 90000);
    const unsub = base44.agents.subscribeToConversation(conversationId, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      if (!msgs.length) return;
      const last = msgs[msgs.length - 1];
      const hasContent = last.role === 'assistant' && last.content && String(last.content).trim().length > 0;
      const isError = ['failed', 'error'].includes(last.status);
      if (hasContent || isError) {
        clearTimeout(hangTimer);
        setLoading(false);
      }
    });
    return () => { unsub(); clearTimeout(hangTimer); };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    setLoading(true);
    try {
      if (!conversationId) {
        const conv = await base44.agents.createConversation({
          agent_name: 'security_auditor',
          metadata: { name: 'Auditoria de Segurança' },
        });
        setConversationId(conv.id);
        await base44.agents.addMessage(conv, { role: 'user', content });
      } else {
        const conv = await base44.agents.getConversation(conversationId);
        await base44.agents.addMessage(conv, { role: 'user', content });
      }
    } catch (e) {
      setLoading(false);
      alert('Erro ao conversar com o agente: ' + (e?.response?.data?.error || e.message));
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-extrabold">Agente de Segurança</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Auditoria Red Team & Blue Team com evidências. Ele registra achados apenas com sua permissão e nunca altera nada sozinho.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md mt-1">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-left text-xs p-2.5 rounded-xl border border-border bg-card/60 hover:border-primary/40 hover:bg-accent transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
        {loading && (
          <div className="flex justify-start">
            <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Analisando...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
            placeholder="Peça uma auditoria (Red Team, Blue Team, RLS, LLMConfig)..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all"
          />
          <button type="submit" disabled={loading || !input.trim()}
            className="px-4 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
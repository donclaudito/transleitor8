import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, ShieldAlert } from 'lucide-react';
import MessageBubble from '@/components/elio/MessageBubble';

// Auditorias guiadas: prompts focados que só aceitam evidência consultável.
const SUGGESTIONS = [
  'Audite apenas os provedores de IA (LLMConfig): liste api_url, api_key_env_var, supports_image e is_active, e sinalize só o que estiver comprovadamente inseguro (URL http://, variável de chave vazia, chave gravada no cadastro). Se algo não puder ser consultado, diga "sem acesso para verificar".',
  'Audite apenas os links do app (AppLink): liste nome, url e status, sinalizando somente URLs sem TLS (http://) ou destinos suspeitos. Se algo não puder ser consultado, diga "sem acesso para verificar".',
  'Faça uma auditoria Blue Team da segregação de dados clínicos (Evolution, Patient): analise com base SOMENTE no que puder consultar e nos achados registrados; o que não puder verificar, declare "sem acesso para verificar".',
  'Resuma a postura de segurança atual com base SOMENTE nos achados registrados no painel — sem especular vulnerabilidades não evidenciadas.',
];

// Chat com o Agente de Segurança: auditoria Red/Blue Team com evidências, roteada
// pelo provedor Groq (função securityAgentChat — não usa créditos de integração).
// A conversa vive no estado local do painel; o agente é consultivo e nunca altera dados.
export default function SecurityAgentChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    setError('');
    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const res = await base44.functions.invoke('securityAgentChat', { messages: nextMessages });
      const reply = res?.data?.text;
      if (!reply) throw new Error(res?.data?.error || 'Resposta vazia do agente.');
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'erro desconhecido';
      setError('Erro ao conversar com o agente: ' + msg);
      setMessages((prev) => prev.slice(0, -1)); // remove a mensagem sem resposta
    } finally {
      setLoading(false);
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
                Auditoria Red Team &amp; Blue Team com evidências. Ele analisa e orienta — a decisão de registrar e corrigir é sempre sua.
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
        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
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
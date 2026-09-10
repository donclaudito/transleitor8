import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, Sparkles, Paperclip, X, FileText } from 'lucide-react';
import MessageBubble from './MessageBubble';

const SUGGESTIONS = [
'Ajude-me a estruturar uma evolução SOAP para paciente pós-operatório de colecistectomia',
'Interprete este hemograma: Hb 9.2, leucócitos 14.500, PCR 18 mg/dL',
'Quais red flags devo vigiar em paciente no DPO 5 com febre?',
'Sugira um plano terapêutico para paciente com HAS e DM2 internada'];


const ACCEPTED_TYPES = 'image/*,application/pdf,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx';

const titleFromContent = (content) => {
  const t = (content || '').replace(/\s+/g, ' ').trim();
  return t.length > 40 ? t.slice(0, 40).trim() + '…' : t || 'Nova conversa';
};

const msgsKey = (id) => `elio_msgs_${id}`;
const readStoredMsgs = (id) => {
  try { return JSON.parse(sessionStorage.getItem(msgsKey(id)) || '[]'); } catch { return []; }
};
// Erros de crédito/limite da plataforma (402) acionam o modo local — nunca travam o chat.
const erroDeCredito = (e) => /limit|402|credit|cr[eé]dito|integration|automation/i.test(String(e?.response?.data?.error || e?.message || e || ''));

export default function ElioChat({ conversationId, onConversationCreated, selectedLLMId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const fallbackRef = useRef(false); // créditos esgotados: modo local pelo resto da sessão
  const convIdRef = useRef(conversationId); // conversa ativa para fechamentos antigos (timer)
  const msgOriginRef = useRef(null); // conversa à qual pertencem as mensagens em tela
  const queryClient = useQueryClient();

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
  };

  // Fallback DeepSeek: com os créditos da integração principal esgotados, a resposta
  // vem pelos créditos próprios do médico (elioChat sem provedor selecionado).
  const responderComFallback = async (historia, convId = convIdRef.current) => {
    // Uma vez detectado, o modo local vale para o resto da sessão: a consulta clínica
    // continua respondendo sem novas tentativas (que falhariam) na plataforma.
    fallbackRef.current = true;
    msgOriginRef.current = convId || null;
    clearFallbackTimer();
    queryClient.invalidateQueries({ queryKey: ['elio-conversations'] });
    setMessages(prev => (historia.length >= prev.length ? historia : prev));
    setLoading(true);
    try {
      const res = await base44.functions.invoke('elioChat', { messages: historia });
      const reply = res?.data?.text;
      if (!reply) throw new Error(res?.data?.error || 'Resposta vazia do provedor.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `<p><em>⚡ Créditos da integração principal esgotados — resposta gerada com DeepSeek (seus créditos; histórico fica apenas nesta sessão).</em></p>${reply}`,
      }]);
    } catch (e) {
      const reason = String(e?.response?.data?.error || e?.message || 'erro desconhecido')
        .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `<p><strong>⚠️ Erro ao responder:</strong> ${reason}</p>`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!conversationId) {setMessages([]);return;}
    setMessages([]);
    setLoading(true);
    let hangTimer = null;
    const armHangTimer = () => {
      if (hangTimer) clearTimeout(hangTimer);
      // Safety: se nenhuma mensagem terminal chegar em 90s, desbloqueia o loading.
      hangTimer = setTimeout(() => setLoading(false), 90000);
    };
    armHangTimer();
    // Retomar conversa: carrega o histórico completo de imediato (a assinatura cuida das novidades)
    base44.agents.getConversation(conversationId).then((c) => {
      const server = c?.messages || [];
      // Sem histórico na plataforma (créditos esgotados), retoma o que foi conversado
      // localmente nesta sessão — o clique na barra lateral recarrega o chat.
      const stored = readStoredMsgs(conversationId);
      const fromStored = stored.length > server.length;
      const msgs = fromStored ? stored : server;
      msgOriginRef.current = conversationId;
      if (fromStored) {
        if (hangTimer) clearTimeout(hangTimer);
        clearFallbackTimer();
        setMessages(msgs);
        setLoading(false);
        return;
      }
      if (!msgs.length) {
        // conversa vazia retomada: nada pendente, encerra o loading
        if (hangTimer) clearTimeout(hangTimer);
        clearFallbackTimer();
        setLoading(false);
        return;
      }
      setMessages((prev) => (msgs.length >= prev.length ? msgs : prev));
      const last = msgs[msgs.length - 1];
      const hasContent = last.role === 'assistant' && last.content && String(last.content).trim().length > 0;
      const isError = ['failed', 'error'].includes(last.status);
      if (hasContent || isError) {
        if (hangTimer) clearTimeout(hangTimer);
        clearFallbackTimer();
        setLoading(false);
      }
    }).catch(() => setLoading(false));
    const unsub = base44.agents.subscribeToConversation(conversationId, (data) => {
      const msgs = data.messages || [];
      // ignora eventos vazios/antigos que apagariam o histórico já carregado
      msgOriginRef.current = conversationId;
      setMessages((prev) => (msgs.length >= prev.length ? msgs : prev));
      armHangTimer();
      if (!msgs.length) return;
      const last = msgs[msgs.length - 1];
      const hasContent = last.role === 'assistant' && last.content && String(last.content).trim().length > 0;
      const isError = ['failed', 'error'].includes(last.status);
      const endedEmpty = last.role === 'assistant' && !last.content && !(last.tool_calls && last.tool_calls.length);
      if (hasContent || isError || endedEmpty) {
        if (hangTimer) clearTimeout(hangTimer);
        clearFallbackTimer();
        setLoading(false);
        queryClient.invalidateQueries({ queryKey: ['elio-conversations'] });
      }
    });
    return () => {unsub();if (hangTimer) clearTimeout(hangTimer);clearFallbackTimer();};
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pendingFiles]);

  // Conversa ativa em ref: timers assíncronos leem o valor atualizado.
  useEffect(() => { convIdRef.current = conversationId; }, [conversationId]);

  // Histórico da sessão: grava as mensagens desta conversa para que o clique na
  // barra lateral retome o chat mesmo sem persistência da plataforma.
  useEffect(() => {
    if (!conversationId || !messages.length || msgOriginRef.current !== conversationId) return;
    try { sessionStorage.setItem(msgsKey(conversationId), JSON.stringify(messages)); } catch { /* best-effort */ }
  }, [messages, conversationId]);

  // Troca de modelo: inicia nova conversa local (limpa mensagens e anexos pendentes).
  useEffect(() => {
    setMessages([]);
    setPendingFiles([]);
  }, [selectedLLMId]);

  const handleSelectFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const mapped = files.map((f) => ({ file: f, name: f.name, type: f.type, size: f.size, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null }));
    setPendingFiles((prev) => [...prev, ...mapped]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePending = (idx) => {
    setPendingFiles((prev) => {
      const item = prev[idx];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const uploadFiles = async () => {
    if (!pendingFiles.length) return [];
    setUploading(true);
    try {
      const urls = [];
      for (const item of pendingFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });
        urls.push(file_url);
      }
      return urls;
    } finally {
      setUploading(false);
    }
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content && !pendingFiles.length || loading || uploading) return;

    // Provedor externo selecionado: conversa local da sessão via elioChat.
    if (selectedLLMId) {
      if (!content) return;
      setInput('');
      const nextMessages = [...messages, { role: 'user', content }];
      setMessages(nextMessages);
      setLoading(true);
      try {
        const res = await base44.functions.invoke('elioChat', { messages: nextMessages, llm_config_id: selectedLLMId });
        const reply = res?.data?.text;
        if (!reply) throw new Error(res?.data?.error || 'Resposta vazia do provedor.');
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } catch (e) {
        const reason = (e?.response?.data?.error || e.message || 'erro desconhecido')
          .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: `<p><strong>⚠️ Erro ao responder com o provedor selecionado:</strong> ${reason}</p><p>Sua mensagem foi mantida acima — tente novamente ou volte ao modo padrão (Elvio).</p>`,
        }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Créditos do provedor principal esgotados nesta sessão: segue direto no modo
    // local, sem novas tentativas na plataforma — a consulta não pode parar.
    if (fallbackRef.current) {
      if (!content) return;
      setInput('');
      setPendingFiles([]);
      const next = [...messages, { role: 'user', content }];
      await responderComFallback(next, conversationId);
      return;
    }

    let fileUrls = [];
    if (pendingFiles.length) {
      try {
        fileUrls = await uploadFiles();
      } catch (_) {
        // Armazenamento da plataforma sem créditos: avisa e mantém o chat utilizável.
        setInput('');
        setPendingFiles([]);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '<p><strong>⚠️ Anexos indisponíveis agora</strong> (armazenamento da plataforma sem créditos de integração). Envie sua mensagem sem anexo ou tente novamente quando os créditos forem renovados.</p>',
        }]);
        return;
      }
    }
    const finalContent = content || (pendingFiles.length ? `Enviei ${pendingFiles.length} anexo(s).` : '');
    setInput('');
    setPendingFiles([]);
    setLoading(true);
    const proximaHistoria = [...messages, { role: 'user', content: finalContent }];
    let novaConvId = null;
    try {
      if (!conversationId) {
        const meta = { name: titleFromContent(finalContent) };
        try {
          const origemCtx = sessionStorage.getItem('elvira_origem');
          if (origemCtx) meta.origem = origemCtx; // contexto de onde a consulta foi iniciada
        } catch { /* best-effort */ }
        const conv = await base44.agents.createConversation({
          agent_name: 'elio',
          metadata: meta
        });
        novaConvId = conv.id;
        onConversationCreated?.(conv.id);
        await base44.agents.addMessage(conv, { role: 'user', content: finalContent, file_urls: fileUrls });
      } else {
        const conv = await base44.agents.getConversation(conversationId);
        await base44.agents.addMessage(conv, { role: 'user', content: finalContent, file_urls: fileUrls });
      }
    } catch (e) {
      // Créditos da integração principal esgotados: a Elvira responde com a DeepSeek
      // e o modo local passa a valer para o resto da sessão.
      if (erroDeCredito(e)) { await responderComFallback(proximaHistoria, novaConvId || conversationId); return; }
      // Nenhum outro erro pode travar a consulta: avisa e mantém o chat utilizável.
      clearFallbackTimer();
      setLoading(false);
      const reason = String(e?.response?.data?.error || e?.message || e || 'erro desconhecido')
        .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      msgOriginRef.current = conversationId;
      setMessages(prev => [...prev, { role: 'user', content: finalContent },
        { role: 'assistant', content: `<p><strong>⚠️ Erro ao enviar:</strong> ${reason}</p><p>Tente novamente em instantes.</p>` }]);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['elio-conversations'] });
    // Se a plataforma não responder (créditos esgotados), cai para a DeepSeek.
    clearFallbackTimer();
    fallbackTimerRef.current = setTimeout(() => responderComFallback(proximaHistoria), 30000);
  };

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 &&
        <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg"> Elvira</h2>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Sua assistente clínica. Posso ajudar a redigir evoluções, interpretar exames e sugerir condutas — sempre com base nos dados que você fornecer.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-2">
              {SUGGESTIONS.map((s) =>
            <button key={s} onClick={() => send(s)}
            className="text-left text-xs p-3 rounded-xl border border-border bg-card/60 hover:border-primary/40 hover:bg-accent transition-all">
                  {s}
                </button>
            )}
            </div>
          </div>
        }
        {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
        {loading &&
        <div className="flex justify-start">
            <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Elvira está pensando...</span>
            </div>
          </div>
        }
      </div>

      <div className="p-4 border-t border-border glass">
        {pendingFiles.length > 0 &&
        <div className="flex flex-wrap gap-2 mb-2">
            {pendingFiles.map((f, idx) =>
          <div key={idx} className="relative group flex items-center gap-2 pl-2 pr-7 py-1.5 rounded-xl bg-muted border border-border text-xs max-w-[200px]">
                {f.preview ?
            <img src={f.preview} alt={f.name} className="w-8 h-8 rounded object-cover flex-shrink-0" /> :

            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
            }
                <span className="truncate flex-1 font-medium">{f.name}</span>
                <button type="button" onClick={() => removePending(idx)}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
          )}
          </div>
        }
        <form onSubmit={(e) => {e.preventDefault();send();}} className="flex gap-2 items-end">
          <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} multiple onChange={handleSelectFiles} className="hidden" />
          {!selectedLLMId && (
          <button type="button" onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Anexar arquivo (imagem, PDF, documento)"
          className="p-3 rounded-2xl border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 disabled:opacity-40 transition-all btn-press flex-shrink-0">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault();send();}}}
            rows={1}
            placeholder="Descreva o caso clínico ou peça ajuda à Elvira..."
            className="flex-1 px-4 py-3 rounded-2xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all max-h-40" />
          
          <button type="submit" disabled={loading || uploading || !input.trim() && !pendingFiles.length}
          className="p-3 rounded-2xl bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all btn-press">
            {loading || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>);

}
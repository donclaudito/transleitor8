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

export default function ElioChat({ conversationId, onConversationCreated, selectedLLMId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

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
      const msgs = c?.messages || [];
      console.log('[elio-debug] getConversation msgsCount=' + msgs.length + ' vazioVaiRetornar=' + (msgs.length === 0));
      if (!msgs.length) return;
      setMessages((prev) => (msgs.length >= prev.length ? msgs : prev));
      const last = msgs[msgs.length - 1];
      const hasContent = last.role === 'assistant' && last.content && String(last.content).trim().length > 0;
      const isError = ['failed', 'error'].includes(last.status);
      if (hasContent || isError) {
        if (hangTimer) clearTimeout(hangTimer);
        setLoading(false);
      }
    }).catch(() => {});
    const unsub = base44.agents.subscribeToConversation(conversationId, (data) => {
      const msgs = data.messages || [];
      console.log('[elio-debug] sub event msgs=', msgs.length, 'dataKeys=', Object.keys(data || {}).join(','));
      // ignora eventos vazios/antigos que apagariam o histórico já carregado
      setMessages((prev) => (msgs.length >= prev.length ? msgs : prev));
      armHangTimer();
      if (!msgs.length) return;
      const last = msgs[msgs.length - 1];
      const hasContent = last.role === 'assistant' && last.content && String(last.content).trim().length > 0;
      const isError = ['failed', 'error'].includes(last.status);
      const endedEmpty = last.role === 'assistant' && !last.content && !(last.tool_calls && last.tool_calls.length);
      if (hasContent || isError || endedEmpty) {
        if (hangTimer) clearTimeout(hangTimer);
        setLoading(false);
        queryClient.invalidateQueries({ queryKey: ['elio-conversations'] });
      }
    });
    return () => {unsub();if (hangTimer) clearTimeout(hangTimer);};
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pendingFiles]);

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

    const fileUrls = await uploadFiles();
    const finalContent = content || (pendingFiles.length ? `Enviei ${pendingFiles.length} anexo(s).` : '');
    setInput('');
    setPendingFiles([]);
    setLoading(true);
    if (!conversationId) {
      const conv = await base44.agents.createConversation({
        agent_name: 'elio',
        metadata: { name: titleFromContent(finalContent) }
      });
      onConversationCreated?.(conv.id);
      await base44.agents.addMessage(conv, { role: 'user', content: finalContent, file_urls: fileUrls });
    } else {
      const conv = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conv, { role: 'user', content: finalContent, file_urls: fileUrls });
    }
    queryClient.invalidateQueries({ queryKey: ['elio-conversations'] });
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
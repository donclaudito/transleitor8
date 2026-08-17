import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Loader2, AlertCircle, Wrench, FileText, Image as ImageIcon, Copy, Check } from 'lucide-react';

const STATUS = {
  pending: { Icon: Loader2, text: 'Pendente', cls: 'text-muted-foreground animate-spin' },
  running: { Icon: Loader2, text: 'Executando', cls: 'text-blue-500 animate-spin' },
  in_progress: { Icon: Loader2, text: 'Em andamento', cls: 'text-blue-500 animate-spin' },
  completed: { Icon: CheckCircle2, text: 'Concluído', cls: 'text-emerald-500' },
  success: { Icon: CheckCircle2, text: 'Sucesso', cls: 'text-emerald-500' },
  failed: { Icon: AlertCircle, text: 'Falhou', cls: 'text-destructive' },
  error: { Icon: AlertCircle, text: 'Erro', cls: 'text-destructive' },
};

function FunctionDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS[toolCall.status] || STATUS.pending;
  const proj = toolCall.display_projection || {};
  const hide = proj.hide_details && proj.details_redacted;
  let results = null;
  try { results = typeof toolCall.results === 'string' ? JSON.parse(toolCall.results) : toolCall.results; } catch { results = toolCall.results; }
  const failed = ['failed', 'error'].includes(toolCall.status) || results?.success === false;
  const label = failed ? (proj.error_label || s.text)
    : ['pending', 'running', 'in_progress'].includes(toolCall.status) ? (proj.active_label || s.text)
    : (proj.label || s.text);

  return (
    <div className="mt-2 text-xs border border-border rounded-lg bg-muted/40 p-2">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 w-full">
        <s.Icon className={`w-3.5 h-3.5 ${s.cls}`} />
        <Wrench className="w-3 h-3 text-muted-foreground" />
        <span className="font-semibold">{toolCall.name}</span>
        <span className="text-muted-foreground">— {label}</span>
        {!hide && <span className="ml-auto">{expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>}
      </button>
      {!hide && expanded && (
        <div className="mt-2 space-y-2 pl-1">
          {toolCall.arguments_string && (
            <div>
              <p className="font-bold text-muted-foreground mb-0.5">Parâmetros:</p>
              <pre className="bg-background/60 rounded p-2 overflow-x-auto text-[10px]">{toolCall.arguments_string}</pre>
            </div>
          )}
          {results != null && (
            <div>
              <p className="font-bold text-muted-foreground mb-0.5">Resultado:</p>
              <pre className="bg-background/60 rounded p-2 overflow-x-auto text-[10px]">{JSON.stringify(results, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const fileUrls = Array.isArray(message.file_urls) ? message.file_urls : [];
  const isImage = (url) => /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(url) || url.includes('image');

  const copyContent = async () => {
    try {
      if (isUser) {
        await navigator.clipboard.writeText(message.content || '');
      } else {
        // Renderiza o HTML e copia como texto limpo, preservando quebras de linha das tabelas
        const tmp = document.createElement('div');
        tmp.innerHTML = message.content || '';
        const text = tmp.innerText.trim();
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (_) {}
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? 'bg-primary text-primary-foreground' : 'glass-card'}`}>
        {fileUrls.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${message.content ? 'mb-2' : ''}`}>
            {fileUrls.map((url, i) => isImage(url) ? (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                <img src={url} alt={`Anexo ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-border/50" />
              </a>
            ) : (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${isUser ? 'bg-primary-foreground/15 hover:bg-primary-foreground/25' : 'bg-muted hover:bg-accent'} transition-colors`}>
                <FileText className="w-4 h-4" />
                <span className="truncate max-w-[160px]">{url.split('/').pop() || `Anexo ${i + 1}`}</span>
              </a>
            ))}
          </div>
        )}
        {message.content && (isUser
          ? <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          : <div className="text-sm max-w-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:ml-4 [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_h4]:font-bold [&_h4]:mt-2 [&_h4]:mb-1 [&_table]:my-2 [&_th]:border [&_th]:border-border [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:bg-muted [&_th]:text-left [&_th]:font-bold [&_th]:text-xs [&_td]:border [&_td]:border-border [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:text-xs [&_strong]:font-bold [&_code]:bg-amber-500/10 [&_code]:text-amber-600 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:font-bold" dangerouslySetInnerHTML={{ __html: message.content }} />)}
        {message.tool_calls?.map((tc, i) => <FunctionDisplay key={i} toolCall={tc} />)}
        {!isUser && message.content && (
          <div className="flex justify-end mt-2 -mb-1">
            <button onClick={copyContent}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
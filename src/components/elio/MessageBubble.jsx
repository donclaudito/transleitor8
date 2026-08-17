import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronRight, CheckCircle2, Loader2, AlertCircle, Wrench } from 'lucide-react';

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
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? 'bg-primary text-primary-foreground' : 'glass-card'}`}>
        {message.content && (isUser
          ? <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          : <ReactMarkdown className="text-sm prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">{message.content}</ReactMarkdown>)}
        {message.tool_calls?.map((tc, i) => <FunctionDisplay key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}
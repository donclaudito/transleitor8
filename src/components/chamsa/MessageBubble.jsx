import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, CheckCircle2, User, Sparkles } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard?.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5">
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center mt-0.5">
          <User className="w-4 h-4 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2.5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/20 to-violet-500/20 flex items-center justify-center mt-0.5 border border-teal-500/20">
        <Sparkles className="w-4 h-4 text-teal-500" />
      </div>
      <div className="max-w-[85%] group">
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm glass-card text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_ul]:my-1.5 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-foreground">
          <ReactMarkdown>{message.content || ''}</ReactMarkdown>
        </div>
        {message.content && (
          <button
            onClick={handleCopy}
            className="mt-1 ml-1 text-[11px] font-semibold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        )}
      </div>
    </div>
  );
}
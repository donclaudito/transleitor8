import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, Check, Sparkles } from 'lucide-react';

// Seletor do modelo que responde à Elvira: "Padrão (Elvira)" (agente da plataforma)
// ou um provedor externo ativo (LLMConfig), no estilo pill/dropdown dos seletores do app.
export default function ElioModelSelector({ providers = [], selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState({ top: 0, right: 0 });
  const selected = providers.find(p => p.id === selectedId);

  return (
    <div className="relative ml-auto">
      <button
        onClick={(e) => {
          if (!open) {
            const r = e.currentTarget.getBoundingClientRect();
            setRect({ top: r.bottom + 8, right: window.innerWidth - r.right });
          }
          setOpen(!open);
        }}
        title="Modelo que responde à Elvira"
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 hover:bg-primary/20 transition-all cursor-pointer"
      >
        <Sparkles className="w-3 h-3" /> {selected ? selected.provider_name : 'Padrão (Elvira)'}
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="fixed w-56 bg-card rounded-xl border border-border shadow-2xl overflow-hidden z-[61]" style={{ top: rect.top, right: rect.right }}>
            <div className="py-1">
              <button
                onClick={() => { onSelect(''); setOpen(false); }}
                className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-accent transition-colors ${!selectedId ? 'bg-primary/10 text-primary font-bold' : ''}`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="flex-1 truncate">Padrão (Elvira)</span>
                {!selectedId && <Check className="w-3 h-3 text-green-500" />}
              </button>
              {providers.map(p => (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p.id); setOpen(false); }}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-accent transition-colors ${selectedId === p.id ? 'bg-primary/10 text-primary font-bold' : ''}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="flex-1 truncate">{p.provider_name}</span>
                  {selectedId === p.id && <Check className="w-3 h-3 text-green-500" />}
                </button>
              ))}
              {providers.length === 0 && (
                <p className="px-4 py-2.5 text-xs text-muted-foreground">Nenhum provedor ativo</p>
              )}
            </div>
          </div>
        </>, document.body
      )}
    </div>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, X } from 'lucide-react';

// Combobox de setor/unidade com BUSCA: filtra ao digitar (ignora acentos), mostra o nome
// completo da unidade e devolve sempre um valor REAL da lista (alimenta pestanas/geração).
// A lista abre como PAINEL FLUTUANTE via portal no document.body (padrão do app), sempre
// por cima de todo o conteúdo (inclusive da seção Comorbidades), com rolagem própria,
// fechando ao clicar fora ou com Escape. No celular, inverte a âncora quando não couber abaixo.
export default function SectorCombobox({ value, onChange, sectors, invalid }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [pos, setPos] = useState(null);
  const containerRef = useRef(null);
  const listaRef = useRef(null);
  const inputRef = useRef(null);

  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtrados = query.trim() ? sectors.filter(s => norm(s).includes(norm(query))) : sectors;

  const abrir = () => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const vh = window.innerHeight;
    const espacoAbaixo = vh - r.bottom - 16;
    const usarAcima = espacoAbaixo < 220 && r.top > 260;
    setPos(usarAcima
      ? { left: r.left, width: r.width, bottom: vh - r.top + 8, maxHeight: Math.max(160, Math.min(r.top - 16, Math.round(vh * 0.45))) }
      : { left: r.left, width: r.width, top: r.bottom + 8, maxHeight: Math.max(160, Math.min(espacoAbaixo - 8, Math.round(vh * 0.45))) });
    setQuery('');
    setIndiceAtivo(0);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const fechar = () => setOpen(false);

  // Mantém a opção ativa visível na rolagem
  useEffect(() => {
    if (open) listaRef.current?.querySelectorAll('button')[indiceAtivo]?.scrollIntoView({ block: 'nearest' });
  }, [indiceAtivo, open]);

  // O painel é fixo (portal): se o usuário rolar o formulário com a lista aberta,
  // ela ficaria solta do campo — fecha. Rolagem DENTRO da lista não fecha.
  useEffect(() => {
    if (!open) return;
    const aoRolar = (e) => {
      if (listaRef.current && (e.target === listaRef.current || listaRef.current.contains(e.target))) return;
      setOpen(false);
    };
    window.addEventListener('scroll', aoRolar, true);
    return () => window.removeEventListener('scroll', aoRolar, true);
  }, [open]);

  const escolher = (s) => { onChange(s); setOpen(false); setQuery(''); };

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { e.preventDefault(); abrir(); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndiceAtivo(i => Math.min(i + 1, filtrados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndiceAtivo(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtrados[indiceAtivo]) escolher(filtrados[indiceAtivo]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div className="relative flex-1 min-w-0" ref={containerRef}>
      <div className={`flex items-center gap-2 px-4 rounded-xl bg-muted border text-sm transition-all ${invalid ? 'border-red-500' : 'border-border focus-within:border-primary/50'}`}>
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-label="Setor / Unidade"
          value={open ? query : value}
          placeholder="Setor / Unidade... (busque ou digite)"
          onFocus={() => { if (!open) abrir(); }}
          onChange={(e) => { setQuery(e.target.value); setIndiceAtivo(0); if (!open) abrir(); }}
          onKeyDown={onKeyDown}
          className="flex-1 min-w-0 py-3 bg-transparent focus:outline-none"
        />
        {value && !open && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange(''); }}
            title="Limpar setor"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => (open ? fechar() : abrir())}
          title="Abrir/fechar lista de setores"
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={fechar} />
          <div
            ref={listaRef}
            className="fixed z-[61] overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-primary/35 [&::-webkit-scrollbar-thumb]:rounded-full"
            style={{
              left: pos.left,
              width: pos.width,
              ...(pos.top != null ? { top: pos.top } : { bottom: pos.bottom }),
              maxHeight: pos.maxHeight,
            }}
          >
            {filtrados.length === 0 && (
              <p className="px-4 py-3 text-xs text-muted-foreground">Nenhum setor encontrado.</p>
            )}
            {filtrados.map((s, i) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => escolher(s)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-accent transition-colors ${i === indiceAtivo ? 'bg-accent' : ''} ${value === s ? 'font-bold text-primary' : ''}`}
              >
                <span className="truncate">{s}</span>
                {value === s && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </>, document.body
      )}
    </div>
  );
}
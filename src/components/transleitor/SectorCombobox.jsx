import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

// Combobox de setor/unidade com BUSCA: filtra ao digitar (ignora acentos), mostra o nome
// completo da unidade e devolve sempre um valor REAL da lista (alimenta pestanas/geração).
// Os setores vêm da lista real do app (padrões + entidade Sector, que hoje só tem `nome` —
// sem ambiente/cidade — então não há agrupamento).
export default function SectorCombobox({ value, onChange, sectors, invalid }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const containerRef = useRef(null);
  const listaRef = useRef(null);
  const inputRef = useRef(null);

  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtrados = query.trim() ? sectors.filter(s => norm(s).includes(norm(query))) : sectors;

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const fechar = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, [open]);

  // Mantém a opção ativa visível na rolagem
  useEffect(() => {
    listaRef.current?.querySelectorAll('button')[indiceAtivo]?.scrollIntoView({ block: 'nearest' });
  }, [indiceAtivo]);

  const escolher = (s) => { onChange(s); setOpen(false); setQuery(''); };

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); setIndiceAtivo(0); return; }
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
          onFocus={() => { setOpen(true); setQuery(''); setIndiceAtivo(0); }}
          onChange={(e) => { setQuery(e.target.value); setIndiceAtivo(0); setOpen(true); }}
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
          onClick={() => {
            if (open) { setOpen(false); }
            else {
              setOpen(true);
              setQuery('');
              setIndiceAtivo(0);
              requestAnimationFrame(() => inputRef.current?.focus());
            }
          }}
          title="Abrir/fechar lista de setores"
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="absolute z-30 left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl" ref={listaRef}>
          {filtrados.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted-foreground">Nenhum setor encontrado.</p>
          )}
          {filtrados.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => escolher(s)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-accent transition-colors ${i === indiceAtivo ? 'bg-accent' : ''} ${value === s ? 'font-bold text-primary' : ''}`}
            >
              <span className="truncate">{s}</span>
              {value === s && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
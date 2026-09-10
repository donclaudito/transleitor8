import React, { useState, useEffect } from 'react';
import { Check, Trash2, Star } from 'lucide-react';

// Realce em negrito do trecho buscado — comparação sem acento e sem caixa.
const CLASSES = { a: 'aàáâãä', e: 'eèéêë', i: 'iìíîï', o: 'oòóôõö', u: 'uùúûü', c: 'cç', n: 'nñ' };
export const Realce = ({ texto, busca }) => {
  const q = (busca || '').trim();
  if (!q) return <>{texto}</>;
  const classe = (ch) => {
    const base = CLASSES[ch.toLowerCase()];
    return base ? `[${base}${base.toUpperCase()}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  let partes;
  try {
    partes = texto.split(new RegExp(`(${[...q].map(classe).join('')})`, 'gi'));
  } catch (_) {
    return <>{texto}</>;
  }
  return <>{partes.map((p, i) => (i % 2 === 1 ? <strong key={i} className="text-foreground">{p}</strong> : p))}</>;
};

// Uma linha de evolução pré-definida: clique insere na Descrição Clínica, estrela
// marca como favorita (sobe para o topo da lista), lixeira exclui (com confirmação).
export default function EvolucaoRow({ frase, busca = '', flash = false, mostrarTitulo = false, onInsert, onToggleFavorita, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div className={`flex items-start gap-1.5 rounded-xl px-3 py-2 border transition-all ${
      flash ? 'bg-primary/15 border-primary/40' : 'border-border hover:border-primary/30'
    }`}>
      <button onClick={() => onInsert(frase)} title="Adicionar à Descrição Clínica Atual"
        className="flex-1 min-w-0 text-left text-xs leading-relaxed cursor-pointer">
        {mostrarTitulo && frase.titulo && (
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-primary mb-0.5">{frase.titulo}</span>
        )}
        <Realce texto={frase.texto} busca={busca} />
      </button>
      <button onClick={() => onToggleFavorita(frase)}
        title={frase.favorita ? 'Remover das favoritas' : 'Marcar como favorita'}
        className={`mt-0.5 transition-colors ${frase.favorita ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'}`}>
        <Star className="w-3.5 h-3.5" fill={frase.favorita ? 'currentColor' : 'none'} />
      </button>
      {confirmDelete ? (
        <button onClick={() => onDelete(frase)} title="Confirmar exclusão"
          className="text-red-500 hover:text-red-400 mt-0.5">
          <Check className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button onClick={() => setConfirmDelete(true)} title="Excluir evolução"
          className="text-muted-foreground hover:text-red-500 mt-0.5 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
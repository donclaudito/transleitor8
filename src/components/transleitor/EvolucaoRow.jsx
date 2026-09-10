import React, { useState, useEffect } from 'react';
import { Check, Trash2, Star, Copy, Printer } from 'lucide-react';

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
// marca como favorita (sobe para o topo da lista), cópia e impressão ao lado da lixeira.
export default function EvolucaoRow({ frase, busca = '', flash = false, mostrarTitulo = false, onInsert, onToggleFavorita, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(frase.texto);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = frase.texto;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Impressão limpa: cria a área de impressão (classe já definida no CSS global),
  // imprime e remove — só o texto da evolução vai para o papel.
  const imprimir = () => {
    const div = document.createElement('div');
    div.className = 'print-area';
    div.style.padding = '24px';
    div.style.fontSize = '12pt';
    div.style.lineHeight = '1.7';
    const titulo = frase.titulo && frase.titulo !== 'GERAL' ? frase.titulo : '';
    const esc = frase.texto.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    div.innerHTML = `${titulo ? `<p style="font-weight:700; margin:0 0 12px;">${titulo}</p>` : ''}<div style="white-space:pre-wrap;">${esc}</div>`;
    document.body.appendChild(div);
    window.print();
    document.body.removeChild(div);
  };

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
      <button onClick={copiar} title={copiado ? 'Copiado!' : 'Copiar evolução'}
        className={`mt-0.5 transition-colors ${copiado ? 'text-emerald-500' : 'text-muted-foreground hover:text-emerald-500'}`}>
        {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <button onClick={imprimir} title="Imprimir evolução"
        className="text-muted-foreground hover:text-primary mt-0.5 transition-colors">
        <Printer className="w-3.5 h-3.5" />
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
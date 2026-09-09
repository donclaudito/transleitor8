import React from 'react';
import { X } from 'lucide-react';
import { AMBIENTES, ESPECIALIDADES } from '@/lib/clinicas';

// Selo discreto com o contexto (ambiente/especialidade) escolhido no menu.
// Removível: o X esconde o selo e limpa os parâmetros da URL.
export default function ContextoBadge({ ambiente, especialidade, onRemove }) {
  const amb = AMBIENTES[ambiente];
  const esp = ESPECIALIDADES.find(e => e.slug === especialidade);
  if (!amb && !esp) return null;

  return (
    <div className="px-4 pt-4 sm:px-6">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
        {amb && <span>{amb.icone} {amb.rotulo}</span>}
        {amb && esp && <span className="text-primary/40">/</span>}
        {esp && <span>{esp.nome}</span>}
        <button
          onClick={onRemove}
          title="Remover contexto"
          aria-label="Remover contexto"
          className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
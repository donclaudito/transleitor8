import React from 'react';
import { Star } from 'lucide-react';

// Estrela de favorito embutida no chip: clicar favorita/desfavorita SEM selecionar o item.
export default function FavoriteStar({ active, onToggle }) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(); }}
      className={`inline-flex items-center mr-1 transition-colors ${active ? 'text-amber-400' : 'text-muted-foreground/40 hover:text-amber-400'}`}
      title={active ? 'Remover dos favoritos' : 'Favoritar item'}
    >
      <Star className="w-3 h-3" fill={active ? 'currentColor' : 'none'} />
    </span>
  );
}
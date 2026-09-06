import React from 'react';
import FavoriteStar from './FavoriteStar';
import { usePanelFavorites } from '@/hooks/usePanelFavorites';

// Bloco "⭐ Favoritos" fixo no topo do modal: chips clicáveis que selecionam o item
// no estado da própria pestana (funciona com selected em array OU em objeto).
export default function PanelFavoritesBlock({ panel, onToggle, selectedItems }) {
  const { favorites, isFavorite, toggleFavorite } = usePanelFavorites(panel);
  if (favorites.length === 0) return null;

  const isSelected = (item) => Array.isArray(selectedItems)
    ? selectedItems.includes(item)
    : !!selectedItems[item];

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">⭐ Favoritos</h3>
      <div className="flex flex-wrap gap-1.5">
        {favorites.map((fav) => {
          const active = isSelected(fav.item);
          return (
            <span
              key={fav.id}
              onClick={() => onToggle(fav.item)}
              className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                active
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 ring-1 ring-amber-400/30'
                  : 'border-amber-500/25 text-amber-600/90 hover:border-amber-500/50 hover:text-amber-500'
              }`}>
              <FavoriteStar active={isFavorite(fav.item)} onToggle={() => toggleFavorite(fav.item, fav.group_label)} />
              {active && <span>✓</span>}
              {fav.item}
            </span>
          );
        })}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import FavoriteStar from './FavoriteStar';

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function fuzzyMatch(text, query) {
  if (!query) return true;
  const q = normalize(query);
  const t = normalize(text);
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

// Acordeão reutilizável das pestanas (mesmo padrão visual do CirurgiaPanel).
export function AccordionGroup({ group, selectedItems, onToggle, colorClasses, searchTerm, isFavorite, toggleFavorite, isGroupFavorite, toggleGroupFavorite }) {
  const [open, setOpen] = useState(false);
  const selectedCount = group.items.filter(i => selectedItems.includes(i)).length;
  const filteredItems = group.items.filter(item => fuzzyMatch(item, searchTerm));
  if (filteredItems.length === 0) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50 transition-colors">
        <span className="text-xs font-bold text-foreground/80 flex items-center">
          <FavoriteStar active={isGroupFavorite(group.label)} onToggle={() => toggleGroupFavorite(group.label)} />
          {group.label}
        </span>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClasses.bg} ${colorClasses.color}`}>
              {selectedCount}
            </span>
          )}
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5 border-t border-border bg-muted/20">
          {filteredItems.map(item => {
            const active = selectedItems.includes(item);
            return (
              <button key={item} onClick={() => onToggle(item)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  active
                    ? `${colorClasses.bg} ${colorClasses.border} ${colorClasses.color} ring-1 ${colorClasses.ring}`
                    : 'border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
                }`}>
                <FavoriteStar active={isFavorite(item)} onToggle={() => toggleFavorite(item, group.label)} />
                {active && <span className="mr-1">✓</span>}
                {item}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SectionAccordion({ section, selectedItems, onToggle, searchTerm, defaultOpen, isFavorite, toggleFavorite, isGroupFavorite, toggleGroupFavorite }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const totalSelected = section.groups.flatMap(g => g.items).filter(i => selectedItems.includes(i)).length;
  const hasMatches = !searchTerm || section.groups.some(g => g.items.some(item => fuzzyMatch(item, searchTerm)));
  const effectiveOpen = searchTerm ? (hasMatches || open) : open;
  const Icon = section.icon;

  return (
    <div className={`rounded-xl border ${section.border} overflow-hidden`}>
      <button onClick={() => setOpen(!effectiveOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${section.bg} transition-colors`}>
        <span className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 ${section.color}`}>
          <Icon className="w-4 h-4" /> {section.label}
        </span>
        <div className="flex items-center gap-2">
          {totalSelected > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20 ${section.color}`}>
              {totalSelected} selecionado{totalSelected !== 1 ? 's' : ''}
            </span>
          )}
          {effectiveOpen ? <ChevronDown className={`w-4 h-4 ${section.color}`} /> : <ChevronRight className={`w-4 h-4 ${section.color}`} />}
        </div>
      </button>
      {effectiveOpen && (
        <div className="p-2 space-y-1.5 bg-card/40">
          {[...section.groups].sort((a, b) => (isGroupFavorite(b.label) ? 1 : 0) - (isGroupFavorite(a.label) ? 1 : 0)).map(g => (
            <AccordionGroup key={g.label} group={g} selectedItems={selectedItems} onToggle={onToggle}
              colorClasses={{ bg: section.bg, border: section.border, color: section.color, ring: section.ring }}
              searchTerm={searchTerm} isFavorite={isFavorite} toggleFavorite={toggleFavorite}
              isGroupFavorite={isGroupFavorite} toggleGroupFavorite={toggleGroupFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}
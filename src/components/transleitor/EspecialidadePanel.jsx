import React, { useState } from 'react';
import { PanelLeft, Search, Stethoscope } from 'lucide-react';
import CustomPanelItems from './CustomPanelItems';
import PanelFavoritesBlock from './PanelFavoritesBlock';
import { usePanelFavorites } from '@/hooks/usePanelFavorites';
import { SectionAccordion } from './PanelAccordion';
import { PANELS_ESPECIALIDADE } from '@/lib/panelsEspecialidade';

// Pestana lateral por ESPECIALIDADE (padrão CirurgiaPanel): pestana vertical à esquerda
// que abre um modal com as seções/grupos/itens da área, "Meus itens" e favoritos do médico.
// Especialidade SEM config (criada pelo médico) abre a versão GENÉRICA: apenas "Meus
// itens" e favoritos — sem conteúdo clínico fabricado.
export default function EspecialidadePanel({ slug, nomeArea, onAppend }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isFavorite, toggleFavorite, isGroupFavorite, toggleGroupFavorite } = usePanelFavorites(slug);

  const cfg = PANELS_ESPECIALIDADE[slug];
  const titulo = cfg?.nome || nomeArea || slug;
  const secoes = cfg ? Object.entries(cfg.secoes) : [];
  const gruposLabels = cfg ? Object.values(cfg.secoes).flatMap(s => s.groups.map(g => g.label)) : [];

  const handleToggle = (item) => {
    setSelected(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleClearAll = () => {
    setSelected([]);
    setSearchTerm('');
  };

  const handleInsertSelected = () => {
    if (selected.length === 0) return;
    onAppend(selected.join('; '));
    setSelected([]);
    setSearchTerm('');
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        title={titulo}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-2 py-4 rounded-r-xl border border-l-0 border-border shadow-lg bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
        <PanelLeft className="w-4 h-4" />
        <span className="text-[10px] font-bold tracking-wider uppercase whitespace-nowrap"
          style={{ writingMode: 'vertical-rl' }}>
          {titulo}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex-shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-primary" /> {titulo}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {cfg ? 'Itens da especialidade — selecione para inserir na descrição' : 'Pestana da especialidade — crie seus itens em "Meus itens"'}
                    </p>
                  </div>
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
                    ×
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar itens..."
                    className="w-full pl-8 pr-8 py-2 rounded-lg bg-muted border border-border text-xs focus:outline-none focus:border-primary/50 transition-all"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <PanelFavoritesBlock panel={slug} onToggle={handleToggle} selectedItems={selected} />
                {secoes.map(([key, section]) => (
                  <SectionAccordion
                    key={key}
                    section={section}
                    selectedItems={selected}
                    onToggle={handleToggle}
                    searchTerm={searchTerm}
                    defaultOpen={key === secoes[0][0]}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                    isGroupFavorite={isGroupFavorite}
                    toggleGroupFavorite={toggleGroupFavorite}
                  />
                ))}
                <CustomPanelItems panel={slug} title={titulo} onAppend={onAppend}
                  groups={gruposLabels} />
              </div>

              <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {selected.length > 0
                      ? <><span className="font-bold text-primary">{selected.length}</span> item(s) selecionado(s)</>
                      : 'Clique nos itens para selecionar'}
                  </p>
                  {selected.length > 0 && (
                    <button onClick={handleClearAll}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors font-semibold">
                      Limpar seleção
                    </button>
                  )}
                </div>
                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {selected.map(item => (
                      <span key={item}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                <button onClick={handleInsertSelected} disabled={selected.length === 0}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Inserir selecionados ({selected.length})
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
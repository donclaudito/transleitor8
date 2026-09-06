import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, FolderOpen } from 'lucide-react';
import FavoriteStar from './FavoriteStar';
import { usePanelFavorites } from '@/hooks/usePanelFavorites';

const PANEL_LABELS = {
  uti: 'UTI Cirúrgica',
  cirurgia: 'Cirurgia',
  ps: 'Pronto Socorro',
  emergencia: 'Avaliação Cirúrgica',
  sintomas: 'Sintomas',
  gastro: 'Gastro',
};

// Bloco "⭐ Meus itens" de cada pestana: itens personalizados do médico logado,
// salvos por usuário (RLS), organizados por seção/grupo da pestana, com seleção
// múltipla, inserção na Descrição Clínica e atalho para duplicar em outra pestana.
export default function CustomPanelItems({ panel, title, groups = [], onAppend }) {
  const [newItem, setNewItem] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [dupTarget, setDupTarget] = useState('');
  const [selected, setSelected] = useState([]);
  const queryClient = useQueryClient();
  const { isFavorite, toggleFavorite } = usePanelFavorites(panel);

  const { data: items = [] } = useQuery({
    queryKey: ['panel-custom-items', panel],
    queryFn: () => base44.entities.PanelCustomItem.filter({ panel }),
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, group_label, duplicateTo }) => {
      const created = await base44.entities.PanelCustomItem.create({ panel, name, group_label });
      let duplicate = null;
      if (duplicateTo) {
        duplicate = await base44.entities.PanelCustomItem.create({ panel: duplicateTo, name, group_label: '' });
      }
      return { created, duplicate, duplicateTo };
    },
    // Cache imediato: insere o registro na lista na hora, sem esperar refetch.
    onSuccess: ({ created, duplicate, duplicateTo }) => {
      queryClient.setQueryData(['panel-custom-items', panel], (old = []) => [...old, created]);
      if (duplicate && duplicateTo) {
        queryClient.setQueryData(['panel-custom-items', duplicateTo], (old = []) => [...old, duplicate]);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PanelCustomItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['panel-custom-items', panel] }),
  });

  const handleAdd = () => {
    const name = newItem.trim();
    if (!name) return;
    // Item já existe: mantém a seção e apenas limpa o texto.
    if (items.some((rec) => rec.name === name)) {
      setNewItem('');
      return;
    }
    createMutation.mutate({ name, group_label: newGroup.trim(), duplicateTo: dupTarget || null });
    // Só o texto é limpo — a seção (e o atalho de duplicação) ficam mantidos
    // para adicionar vários itens seguidos na mesma seção.
    setNewItem('');
  };

  const handleRemove = (rec) => {
    deleteMutation.mutate(rec.id);
    setSelected((prev) => prev.filter((n) => n !== rec.name));
  };

  const handleToggle = (name) => {
    setSelected((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };

  const handleInsert = () => {
    if (selected.length === 0) return;
    onAppend(selected.join('; '));
    setSelected([]);
  };

  // Agrupa itens por seção: grupos da pestana em ordem, depois seções avulsas, "Geral" por último.
  const itemsByGroup = {};
  items.forEach((rec) => {
    const label = rec.group_label?.trim() ? rec.group_label.trim() : 'Geral';
    (itemsByGroup[label] ||= []).push(rec);
  });
  const orderedLabels = [
    ...groups.filter((l) => itemsByGroup[l]?.length),
    ...Object.keys(itemsByGroup).filter((l) => l !== 'Geral' && !groups.includes(l)),
    'Geral',
  ].filter((l) => itemsByGroup[l]?.length);

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] p-3 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        ⭐ Meus itens{title ? ` (${title})` : ''}
      </h3>
      {items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Nenhum item personalizado ainda...</p>
      ) : (
        <div className="space-y-2">
          {orderedLabels.map((label) => (
            <div key={label} className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <FolderOpen className="w-3 h-3" /> {label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {itemsByGroup[label].map((rec) => {
                  const active = selected.includes(rec.name);
                  return (
                    <span
                      key={rec.id}
                      onClick={() => handleToggle(rec.name)}
                      className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                        active
                          ? 'bg-primary/15 border-primary/40 text-primary ring-1 ring-primary/30'
                          : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      }`}>
                      <FavoriteStar active={isFavorite(rec.name)} onToggle={() => toggleFavorite(rec.name, rec.group_label || 'Meus itens')} />
                      {active && <span>✓</span>}
                      {rec.name}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemove(rec); }}
                        className="ml-1 text-muted-foreground/60 hover:text-destructive transition-colors"
                        title="Remover item">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder="+ Novo item"
          className="flex-1 px-3 py-1.5 rounded-lg bg-muted border border-border text-[11px] focus:outline-none focus:border-primary/50 transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="px-2.5 rounded-lg border border-border text-primary hover:bg-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title="Adicionar item">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-1.5">
        {groups.length > 0 ? (
          <select
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            title="Seção da pestana onde o item ficará"
            className="flex-1 px-2 py-1.5 rounded-lg bg-muted border border-border text-[11px] focus:outline-none focus:border-primary/50 transition-all">
            <option value="">Seção: Geral</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        ) : (
          <input
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            placeholder="Seção (opcional)..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-muted border border-border text-[11px] focus:outline-none focus:border-primary/50 transition-all"
          />
        )}
        <select
          value={dupTarget}
          onChange={(e) => setDupTarget(e.target.value)}
          title="Criar o mesmo item também em outra pestana"
          className="flex-1 px-2 py-1.5 rounded-lg bg-muted border border-border text-[11px] focus:outline-none focus:border-primary/50 transition-all">
          <option value="">📄 Só nesta pestana</option>
          {Object.entries(PANEL_LABELS).filter(([key]) => key !== panel).map(([key, label]) => (
            <option key={key} value={key}>Duplicar p/ {label}</option>
          ))}
        </select>
      </div>
      <button
        onClick={handleInsert}
        disabled={selected.length === 0}
        className="w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/25 hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
        Inserir selecionados ({selected.length})
      </button>
    </div>
  );
}
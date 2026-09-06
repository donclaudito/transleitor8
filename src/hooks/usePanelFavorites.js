import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Favoritos de uma pestana, por médico logado (RLS garante isolamento por usuário).
export function usePanelFavorites(panel) {
  const queryClient = useQueryClient();

  const { data: favorites = [] } = useQuery({
    queryKey: ['panel-favorites', panel],
    queryFn: () => base44.entities.PanelFavorite.filter({ panel }),
  });

  const favoriteItems = favorites.map((f) => f.item);
  const isFavorite = (item) => favoriteItems.includes(item);

  const toggleFavorite = async (item, groupLabel) => {
    const existing = favorites.find((f) => f.item === item);
    if (existing) {
      await base44.entities.PanelFavorite.delete(existing.id);
    } else {
      await base44.entities.PanelFavorite.create({ panel, item, group_label: groupLabel || '' });
    }
    queryClient.invalidateQueries({ queryKey: ['panel-favorites', panel] });
  };

  return { favorites, favoriteItems, isFavorite, toggleFavorite };
}
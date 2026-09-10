import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, MessageSquare, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';

const RENAMES_KEY = 'elio_renames';
const ARCHIVED_KEY = 'elio_archived';

const readMap = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
};
const readSet = (key) => {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
};

export default function ElioSidebar({ activeConversationId, onNew, onSelect }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [renames, setRenames] = useState(() => readMap(RENAMES_KEY));
  const [archived, setArchived] = useState(() => readSet(ARCHIVED_KEY));

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['elio-conversations'],
    queryFn: async () => {
      const list = await base44.agents.listConversations({ agent_name: 'elio' });
      const arr = Array.isArray(list) ? list : (list?.conversations || []);
      return arr.sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
    },
  });

  const titleOf = (c) => renames[c.id] || c.metadata?.name || 'Nova conversa';
  const visible = conversations.filter(c => !archived.has(c.id));

  const startEdit = (c) => {
    setEditingId(c.id);
    setDraftName(titleOf(c));
  };

  // Renomear persiste no servidor (sincroniza entre dispositivos); fallback local se falhar
  const saveEdit = async (id) => {
    const name = draftName.trim();
    setEditingId(null);
    if (!name) return;
    const next = { ...renames, [id]: name };
    setRenames(next); // feedback imediato enquanto persiste
    try {
      await base44.agents.updateConversation(id, { metadata: { name } });
      localStorage.setItem(RENAMES_KEY, JSON.stringify(next));
      queryClient.invalidateQueries({ queryKey: ['elio-conversations'] });
    } catch { /* mantém apenas o fallback local */ }
  };

  const cancelEdit = () => setEditingId(null);

  const removeConversation = (c) => {
    if (!confirm(`Excluir a conversa "${titleOf(c)}"?`)) return;
    const next = new Set(archived);
    next.add(c.id);
    setArchived(next);
    localStorage.setItem(ARCHIVED_KEY, JSON.stringify([...next]));
    if (activeConversationId === c.id) onNew();
  };

  return (
    <div className="flex flex-col h-full">
      <button onClick={onNew}
        className="flex items-center gap-2 mx-3 mt-3 px-3 py-2.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent transition-all text-sm font-bold">
        <Plus className="w-4 h-4 text-primary" /> Novo chat
      </button>

      <div className="flex-1 overflow-y-auto px-2 py-2 mt-1 space-y-0.5">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : visible.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8 px-4">
            Nenhuma conversa ainda. Inicie um novo chat.
          </div>
        ) : (
          visible.map((c) => {
            const active = c.id === activeConversationId;
            const isEditing = editingId === c.id;
            return (
              <div key={c.id}
                className={`group flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
                  active ? 'bg-accent' : 'hover:bg-accent/60'
                }`}>
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                {isEditing ? (
                  <>
                    <input value={draftName} onChange={e => setDraftName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') cancelEdit(); }}
                      autoFocus
                      className="flex-1 min-w-0 bg-background border border-primary/40 rounded px-1.5 py-0.5 text-xs outline-none" />
                    <button onClick={() => saveEdit(c.id)} className="p-1 rounded hover:bg-primary/10 text-emerald-500"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={cancelEdit} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => onSelect(c.id)} className="flex-1 min-w-0 text-left">
                      <span className={`block truncate text-sm ${active ? 'font-bold' : 'font-medium'}`}>{titleOf(c)}</span>
                    </button>
                    <button onClick={() => startEdit(c)} title="Renomear"
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeConversation(c)} title="Excluir"
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
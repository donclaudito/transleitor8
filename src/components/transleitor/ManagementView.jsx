import React from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function ManagementView({ title, placeholder, value, onChange, onAdd, items, onDelete, onBack, extraPlaceholder, extraValue, onExtraChange }) {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h2 className="text-lg font-bold">{title}</h2>

      <form onSubmit={onAdd} className="space-y-2">
        <div className="flex gap-2">
          <input value={value} onChange={onChange} placeholder={placeholder}
            className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
          <button type="submit" className="px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {extraPlaceholder && (
          <input value={extraValue || ''} onChange={onExtraChange} placeholder={extraPlaceholder}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
        )}
      </form>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3 glass-card rounded-xl group">
            <span className="text-sm">{item.name}</span>
            <button onClick={() => onDelete(item.id)}
              className="text-muted-foreground/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum item personalizado ainda.</p>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { ArrowLeft, Sun, Moon, Plus, X } from 'lucide-react';

export default function SettingsPanel({ settings, setTheme, addCustomChip, removeCustomChip, onBack }) {
  const [newChip, setNewChip] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    addCustomChip(newChip);
    setNewChip('');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h2 className="text-lg font-bold">Configurações</h2>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold">Aparência</h3>
        <div className="grid grid-cols-2 gap-3">
          {[{ id: 'light', icon: Sun, label: 'Claro' }, { id: 'dark', icon: Moon, label: 'Escuro' }].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTheme(id)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                settings.theme === id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold">Atalhos Personalizados</h3>
        <p className="text-xs text-muted-foreground">Aparecem nos chips de descrição clínica.</p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input value={newChip} onChange={e => setNewChip(e.target.value)} placeholder="Ex: Tabagismo"
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
          <button type="submit" className="px-3 rounded-xl bg-primary text-primary-foreground"><Plus className="w-4 h-4" /></button>
        </form>
        <div className="flex flex-wrap gap-2">
          {settings.customChips.length === 0 && <p className="text-xs text-muted-foreground">Nenhum atalho personalizado ainda.</p>}
          {settings.customChips.map(chip => (
            <span key={chip} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold">
              {chip}
              <button onClick={() => removeCustomChip(chip)} className="text-accent-foreground/40 hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
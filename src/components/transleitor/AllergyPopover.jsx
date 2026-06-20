import React, { useState } from 'react';
import { AlertTriangle, X, Plus, Trash2 } from 'lucide-react';

const COMMON_ALLERGIES = [
  'Penicilina', 'Sulfa', 'AINEs', 'Dipirona', 'Iodo', 'Látex',
  'Contraste iodado', 'Cefalosporinas', 'Quinolonas', 'Aspirina',
];

export default function AllergyPopover({ onAdd, onClose }) {
  const [custom, setCustom] = useState('');
  const [selected, setSelected] = useState([]);

  const toggle = (item) => {
    setSelected(prev => prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]);
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected(prev => [...prev, trimmed]);
    }
    setCustom('');
  };

  const handleConfirm = () => {
    if (selected.length > 0) {
      onAdd(selected.join(', '));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-sm">Alergias do Paciente</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">Selecione as alergias conhecidas:</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_ALLERGIES.map(item => (
              <button
                key={item}
                onClick={() => toggle(item)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  selected.includes(item)
                    ? 'bg-red-500/15 border-red-400/40 text-red-600 dark:text-red-400'
                    : 'border-border text-muted-foreground hover:border-red-300/50'
                }`}
              >
                {selected.includes(item) ? `✓ ${item}` : item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="Outra alergia..."
            className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all"
          />
          <button onClick={addCustom} className="p-2 rounded-xl bg-accent text-accent-foreground hover:opacity-80 transition-all">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {selected.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground">Selecionadas:</p>
            <div className="flex flex-wrap gap-1">
              {selected.map(item => (
                <span key={item} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
                  {item}
                  <button onClick={() => toggle(item)} className="hover:text-red-800 dark:hover:text-red-200">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={selected.length === 0}
          className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-30 transition-all"
        >
          Confirmar Alergias
        </button>
      </div>
    </div>
  );
}
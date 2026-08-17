import React, { useState } from 'react';
import { Pill, X, Plus, Check } from 'lucide-react';

export default function ComorbidityPopover({ comorbidityName, medications, onAddToPrescription, onAddAll, onClose }) {
  const [customMed, setCustomMed] = useState('');
  const [addedIndex, setAddedIndex] = useState(null);
  const [addedCustom, setAddedCustom] = useState(false);

  if (!comorbidityName || !medications) return null;

  const meds = [...new Set(medications.split(',').map(m => m.trim()).filter(Boolean))];

  const handleAddOne = (med, index) => {
    onAddToPrescription(med);
    setAddedIndex(index);
    setTimeout(() => setAddedIndex(null), 1000);
  };

  const addCustom = () => {
    const trimmed = customMed.trim();
    if (trimmed) {
      onAddToPrescription(trimmed);
      setCustomMed('');
      setAddedCustom(true);
      setTimeout(() => setAddedCustom(false), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm">Medicamentos — {comorbidityName}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {meds.map((med, i) => (
            <button
              key={i}
              onClick={() => handleAddOne(med, i)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border flex items-center justify-between group ${
                addedIndex === i
                  ? 'bg-green-500/10 border-green-500/40'
                  : 'hover:bg-accent border-transparent hover:border-border'
              }`}
            >
              <span>{med}</span>
              {addedIndex === i ? (
                <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Adicionado
                </span>
              ) : (
                <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">+ Adicionar</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={customMed}
            onChange={e => setCustomMed(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="Outro medicamento..."
            className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all"
          />
          <button onClick={addCustom} className="p-2 rounded-xl bg-accent text-accent-foreground hover:opacity-80 transition-all">
            {addedCustom ? <Check className="w-4 h-4 text-green-500" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
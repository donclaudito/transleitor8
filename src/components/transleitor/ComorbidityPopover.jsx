import React from 'react';
import { Pill, X } from 'lucide-react';

export default function ComorbidityPopover({ comorbidityName, medications, onAddToPrescription, onClose }) {
  if (!comorbidityName || !medications) return null;

  const meds = medications.split(',').map(m => m.trim()).filter(Boolean);

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
              onClick={() => onAddToPrescription(med)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors border border-transparent hover:border-border flex items-center justify-between group"
            >
              <span>{med}</span>
              <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">+ Adicionar</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onAddToPrescription(medications)}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all"
        >
          Adicionar todos à prescrição
        </button>
      </div>
    </div>
  );
}
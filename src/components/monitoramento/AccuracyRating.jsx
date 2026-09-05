import React, { useState } from 'react';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AccuracyRating({ logId, score = null }) {
  const [value, setValue] = useState(score);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!logId) return null;

  const rate = async (n) => {
    if (saving || (saved && value === n)) return;
    setSaving(true);
    try {
      await base44.entities.LLMUsageLog.update(logId, { accuracy_score: n });
      setValue(n);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 text-amber-400" /> Avalie a precisão deste resultado:
      </span>
      <div className="flex gap-1 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => rate(n)}
            disabled={saving}
            className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all btn-press ${
              value === n
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted border border-border text-muted-foreground hover:text-primary hover:border-primary/40'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      {saved && !saving && (
        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Nota {value} salva
        </span>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

const LABELS = { exame_fisico: 'Exame Físico', plano_conduta: 'Plano de Conduta' };

export default function PhraseCreator({ categoria, onCreate, onClose }) {
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const salvar = async () => {
    if (!texto.trim()) return;
    setSalvando(true);
    setErro('');
    try {
      await onCreate(texto);
    } catch (e) {
      setErro('Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
      <p className="text-[11px] font-semibold text-primary">Nova frase — {LABELS[categoria]}</p>
      <textarea rows={3} value={texto} onChange={e => setTexto(e.target.value)} autoFocus
        placeholder="Digite a frase padrão (exame físico ou plano de conduta)..."
        className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all" />
      {erro && <p className="text-red-500 text-[11px]">{erro}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={onClose}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:bg-accent transition-all">
          <X className="w-3.5 h-3.5" /> Cancelar
        </button>
        <button onClick={salvar} disabled={!texto.trim() || salvando}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all">
          <Save className="w-3.5 h-3.5" /> {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
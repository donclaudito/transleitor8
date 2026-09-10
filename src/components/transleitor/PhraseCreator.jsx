import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

const LABELS = { exame_fisico: 'Exame Físico', plano_conduta: 'Plano de Conduta' };
const NOVO_TITULO = '__novo_titulo__';

// Criação de frase: categoria + TÍTULO (grupo) + CONTEXTO. Por padrão a frase é gravada
// no contexto atual (ambiente/especialidade da tela); marcar "GERAL" a faz valer em
// qualquer área. O título é um combobox: títulos já usados, "novo título" ou GERAL.
export default function PhraseCreator({ categoria, titulos = [], contextoRotulo, onCreate, onClose }) {
  const [texto, setTexto] = useState('');
  const [tituloSel, setTituloSel] = useState('GERAL');
  const [tituloNovo, setTituloNovo] = useState('');
  const [geral, setGeral] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const opcoes = ['GERAL', ...titulos.filter(t => t && t !== 'GERAL')];

  const salvar = async () => {
    if (!texto.trim()) return;
    setSalvando(true);
    setErro('');
    try {
      const titulo = (tituloSel === NOVO_TITULO ? tituloNovo.trim() : tituloSel) || 'GERAL';
      await onCreate(texto, titulo, geral);
    } catch (e) {
      setErro('Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
      <p className="text-[11px] font-semibold text-primary">Nova frase — {LABELS[categoria]}</p>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Título (grupo)</label>
        <select
          value={tituloSel}
          onChange={e => setTituloSel(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all"
        >
          {opcoes.map(t => <option key={t} value={t}>{t}</option>)}
          <option value={NOVO_TITULO}>➕ Novo título...</option>
        </select>
        {tituloSel === NOVO_TITULO && (
          <input
            value={tituloNovo}
            onChange={e => setTituloNovo(e.target.value)}
            autoFocus
            placeholder="Nome do novo título (ex.: UROLOGIA)..."
            className="w-full px-3 py-2 rounded-xl bg-muted border border-primary/40 text-sm focus:outline-none focus:border-primary/50 transition-all"
          />
        )}
      </div>
      <textarea rows={3} value={texto} onChange={e => setTexto(e.target.value)}
        placeholder="Digite a frase padrão (exame físico ou plano de conduta)..."
        className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all" />
      <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
        <input type="checkbox" checked={geral} onChange={e => setGeral(e.target.checked)} className="w-4 h-4 accent-[hsl(var(--primary))]" />
        Frase GERAL (vale em qualquer área)
      </label>
      <p className="text-[10px] text-muted-foreground">
        Gravada em: <strong>{geral ? 'GERAL — qualquer ambiente/especialidade' : contextoRotulo}</strong>
      </p>
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
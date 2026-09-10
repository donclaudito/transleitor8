import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

const LABELS = { evolucao: 'Evolução', exame_fisico: 'Exame Físico', plano_conduta: 'Plano de Conduta', receita: 'Receita' };
const NOVO_TITULO = '__novo_titulo__';

// Criação de evolução pré-definida: categoria + TÍTULO (grupo) + CONTEXTO. A evolução
// é sempre gravada no contexto atual (ambiente/especialidade da tela) — cada médico
// cria as suas, sem compartilhamento entre contextos. O texto é a evolução COMPLETA.
export default function PhraseCreator({ categoria, titulos = [], contextoRotulo, onCreate, onClose }) {
  const [texto, setTexto] = useState('');
  const [tituloSel, setTituloSel] = useState('GERAL');
  const [tituloNovo, setTituloNovo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const opcoes = ['GERAL', ...titulos.filter(t => t && t !== 'GERAL')];

  const salvar = async () => {
    if (!texto.trim()) return;
    setSalvando(true);
    setErro('');
    try {
      const titulo = (tituloSel === NOVO_TITULO ? tituloNovo.trim() : tituloSel) || 'GERAL';
      await onCreate(texto, titulo);
    } catch (e) {
      setErro('Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
      <p className="text-[11px] font-semibold text-primary">Nova evolução — {LABELS[categoria]}</p>
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
      <textarea rows={6} value={texto} onChange={e => setTexto(e.target.value)}
        placeholder={categoria === 'receita' ? 'Cole ou digite a receita completa (medicamentos, posologia, orientações)...' : 'Cole ou digite a evolução completa (texto inteiro)...'}
        className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
      <p className="text-[10px] text-muted-foreground">
        Gravada em: <strong>{contextoRotulo}</strong>
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
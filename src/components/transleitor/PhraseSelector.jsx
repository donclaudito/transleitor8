import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, Search, Plus, Trash2, Check } from 'lucide-react';
import PhraseCreator from './PhraseCreator';

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const CATEGORIAS = [
  { id: 'exame_fisico', label: '🩺 Exame Físico' },
  { id: 'plano_conduta', label: '💊 Plano de Conduta' },
];

export default function PhraseSelector({ onInsert }) {
  const [categoria, setCategoria] = useState('exame_fisico');
  const [busca, setBusca] = useState('');
  const [criando, setCriando] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const queryClient = useQueryClient();

  const { data: frases = [] } = useQuery({
    queryKey: ['frases-predefinidas'],
    queryFn: () => base44.entities.FrasePreDefinida.list(),
    staleTime: Infinity,
  });

  const filtradas = frases
    .filter(f => f.categoria === categoria)
    .filter(f => !busca || norm(f.texto).includes(norm(busca)));

  const inserir = (frase) => {
    const alvo = frase.categoria === 'plano_conduta' ? onInsert.prescription : onInsert.clinical;
    alvo(frase.texto);
    setFlashId(frase.id);
    setTimeout(() => setFlashId(null), 800);
  };

  const criar = async (texto) => {
    const registro = await base44.entities.FrasePreDefinida.create({ categoria, texto: texto.trim() });
    queryClient.setQueryData(['frases-predefinidas'], (old = []) => [...old, registro]);
    setCriando(false);
  };

  const excluir = async (frase) => {
    setConfirmDeleteId(null);
    queryClient.setQueryData(['frases-predefinidas'], (old = []) => old.filter(f => f.id !== frase.id));
    await base44.entities.FrasePreDefinida.delete(frase.id);
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" /> Frases Pré-definidas
        </h3>
        <button onClick={() => setCriando(true)}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border text-primary hover:bg-accent transition-all">
          <Plus className="w-3.5 h-3.5" /> Nova frase
        </button>
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {CATEGORIAS.map(c => (
          <button key={c.id} onClick={() => setCategoria(c.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${categoria === c.id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {frases.filter(f => f.categoria === categoria).length > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar frase..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
        </div>
      )}

      {criando && (
        <PhraseCreator categoria={categoria} onCreate={criar} onClose={() => setCriando(false)} />
      )}

      {filtradas.length === 0 && !criando ? (
        <p className="text-[11px] text-muted-foreground">
          {frases.filter(f => f.categoria === categoria).length === 0
            ? 'Nenhuma frase nesta categoria. Clique em "Nova frase" para criar a primeira.'
            : 'Nenhuma frase encontrada para a busca.'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {filtradas.map(f => (
            <div key={f.id}
              className={`flex items-start gap-2 rounded-xl px-3 py-2 border transition-all ${
                flashId === f.id
                  ? 'bg-primary/15 border-primary/40'
                  : 'border-border hover:border-primary/30'
              }`}>
              <button onClick={() => inserir(f)} title="Inserir no campo correspondente"
                className="flex-1 text-left text-xs leading-relaxed cursor-pointer">
                {f.texto}
              </button>
              {confirmDeleteId === f.id ? (
                <button onClick={() => excluir(f)} title="Confirmar exclusão"
                  className="text-red-500 hover:text-red-400 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={() => { setConfirmDeleteId(f.id); setTimeout(() => setConfirmDeleteId(null), 3000); }}
                  title="Excluir frase"
                  className="text-muted-foreground hover:text-red-500 mt-0.5 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
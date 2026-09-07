import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { BookOpen, Search, Plus, Trash2, Check, ChevronDown } from 'lucide-react';
import PhraseCreator from './PhraseCreator';

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const CATEGORIAS = [
  { id: 'exame_fisico', label: '🩺 Exame Físico' },
  { id: 'plano_conduta', label: '💊 Plano de Conduta' },
];

const loadPref = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
};

export default function PhraseSelector({ onInsert }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Preferência de UI (bloco aberto/fechado + aba ativa) é por usuário:
  // a escolha de um médico não vaza para outro na mesma máquina.
  // Padrão para quem nunca escolheu: recolhido.
  const storageKey = user ? `frases_predef_ui_${user.id}` : null;
  const [ui, setUi] = useState({ aberto: false, aba: 'exame_fisico' });
  const [busca, setBusca] = useState('');
  const [criando, setCriando] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [flashId, setFlashId] = useState(null);

  useEffect(() => {
    if (!storageKey) return;
    const pref = loadPref(storageKey);
    if (pref) setUi(prev => ({ ...prev, ...pref }));
  }, [storageKey]);

  const updateUi = (patch) => setUi(prev => {
    const next = { ...prev, ...patch };
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch (_) {}
    }
    return next;
  });

  // Consulta escopada ao médico logado — não confia só na RLS: filtra pelo dono.
  // Admin não enxerga frases de outros médicos; órfãs (sem dono) não aparecem para ninguém.
  const { data: frases = [], isLoading } = useQuery({
    queryKey: ['frases-predefinidas', user?.id],
    queryFn: () => base44.entities.FrasePreDefinida.filter({ created_by_id: user.id }),
    enabled: !!user,
    staleTime: Infinity,
  });

  const minhas = frases.filter(f => user && f.created_by_id === user.id);
  const categoria = ui.aba;
  const daCategoria = minhas.filter(f => f.categoria === categoria);
  const filtradas = daCategoria.filter(f => !busca || norm(f.texto).includes(norm(busca)));

  const inserir = (frase) => {
    const alvo = frase.categoria === 'plano_conduta' ? onInsert.prescription : onInsert.clinical;
    alvo(frase.texto);
    setFlashId(frase.id);
    setTimeout(() => setFlashId(null), 800);
  };

  const criar = async (texto) => {
    const registro = await base44.entities.FrasePreDefinida.create({ categoria, texto: texto.trim() });
    // Regra dura: só entra na lista se o dono for o médico logado.
    if (user && registro?.created_by_id === user.id) {
      queryClient.setQueryData(['frases-predefinidas', user.id], (old = []) => [...old, registro]);
    } else {
      queryClient.invalidateQueries({ queryKey: ['frases-predefinidas', user.id] });
    }
    setCriando(false);
  };

  const excluir = async (frase) => {
    setConfirmDeleteId(null);
    if (!user || frase.created_by_id !== user.id) return; // exclusão só de frases próprias
    queryClient.setQueryData(['frases-predefinidas', user.id], (old = []) => old.filter(f => f.id !== frase.id));
    await base44.entities.FrasePreDefinida.delete(frase.id);
  };

  if (!user) return null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => updateUi({ aberto: !ui.aberto })}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" /> Frases Pré-definidas
          {minhas.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold normal-case tracking-normal">
              {minhas.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${ui.aberto ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={() => setCriando(true)}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border text-primary hover:bg-accent transition-all">
          <Plus className="w-3.5 h-3.5" /> Nova frase
        </button>
      </div>

      {ui.aberto && (
        <>
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {CATEGORIAS.map(c => (
              <button key={c.id} onClick={() => updateUi({ aba: c.id })}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${categoria === c.id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                {c.label}
              </button>
            ))}
          </div>

          {daCategoria.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar frase..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
            </div>
          )}

          {criando && (
            <PhraseCreator categoria={categoria} onCreate={criar} onClose={() => setCriando(false)} />
          )}

          {isLoading ? (
            <p className="text-[11px] text-muted-foreground">Carregando frases...</p>
          ) : filtradas.length === 0 && !criando ? (
            <p className="text-[11px] text-muted-foreground">
              {daCategoria.length === 0
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
        </>
      )}
    </div>
  );
}
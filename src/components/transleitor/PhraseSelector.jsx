import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { BookOpen, Search, Plus, Trash2, Check, ChevronDown, Filter } from 'lucide-react';
import PhraseCreator from './PhraseCreator';

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const CATEGORIAS = [
  { id: 'exame_fisico', label: '🩺 Exame Físico' },
  { id: 'plano_conduta', label: '💊 Plano de Conduta' },
];
const GERAL = 'GERAL';
const AMBIENTE_ROTULO = { hospital: 'Hospital', clinica: 'Ambulatório' };
const CTX_PADRAO = { ambiente: 'hospital', especialidade: 'geral' };

// Frases sem título (registros antigos ou campo vazio) entram no grupo GERAL.
const tituloDe = (f) => (f.titulo && String(f.titulo).trim()) || GERAL;

// Realce em negrito do trecho buscado — comparação sem acento e sem caixa.
const CLASSES = { a: 'aàáâãä', e: 'eèéêë', i: 'iìíîï', o: 'oòóôõö', u: 'uùúûü', c: 'cç', n: 'nñ' };
const Realce = ({ texto, busca }) => {
  const q = (busca || '').trim();
  if (!q) return <>{texto}</>;
  const classe = (ch) => {
    const base = CLASSES[ch.toLowerCase()];
    return base ? `[${base}${base.toUpperCase()}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  let partes;
  try {
    partes = texto.split(new RegExp(`(${[...q].map(classe).join('')})`, 'gi'));
  } catch (_) {
    return <>{texto}</>;
  }
  return <>{partes.map((p, i) => (i % 2 === 1 ? <strong key={i} className="text-foreground">{p}</strong> : p))}</>;
};

const loadPref = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
};

// contexto = { ambiente: 'hospital'|'clinica', especialidade: slug } da tela atual.
// Cada médico vê apenas as evoluções do CONTEXTO ATUAL — sem grupo GERAIS: cada
// evolução aparece somente no ambiente/especialidade em que foi criada.
export default function PhraseSelector({ onInsert, especialidade = null, contexto }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ctx = contexto ?? CTX_PADRAO;

  // Preferência de UI (bloco aberto/fechado + aba ativa) é por usuário:
  // a escolha de um médico não vaza para outro na mesma máquina.
  // Padrão para quem nunca escolheu: recolhido, nenhum título aberto.
  const storageKey = user ? `frases_predef_ui_${user.id}` : null;
  const [ui, setUi] = useState({ aberto: false, aba: 'exame_fisico' });
  const [tituloAberto, setTituloAberto] = useState(null); // acordeão exclusivo: só um título aberto
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
    // Sem staleTime infinito: ao trocar de rota/contexto o componente remonta e busca de
    // novo — frases criadas em outro dispositivo/contexto aparecem sem recarregar a página.
  });

  const minhas = frases.filter(f => user && f.created_by_id === user.id);
  // Sem grupo GERAIS: cada evolução aparece APENAS no ambiente/especialidade em que
  // foi criada — nada é compartilhado entre contextos.
  const doContexto = minhas.filter(f => f.ambiente === ctx.ambiente && f.especialidade === ctx.especialidade);
  const visiveis = doContexto.length;
  const categoria = ui.aba;
  const daCategoria = doContexto.filter(f => f.categoria === categoria);
  const titulosExistentes = [...new Set(doContexto.map(tituloDe))].filter(t => t !== GERAL);

  // Agrupa as frases do contexto por título, na ordem em que aparecem.
  const grupos = [];
  daCategoria.forEach(f => {
    const t = tituloDe(f);
    let g = grupos.find(x => x.titulo === t);
    if (!g) { g = { titulo: t, frases: [] }; grupos.push(g); }
    g.frases.push(f);
  });

  // Especialidade de início (tela de variante): o título correspondente vem PRIMEIRO,
  // com selo; os demais seguem na ordem normal. Sem especialidade, ordem normal.
  // Especialidade da tela: nome da variante (ex.: Urologia) ou o slug do contexto
  // selecionado no menu (fluxo hospitalar via URL) — em ambos, o grupo da própria
  // especialidade vem primeiro com selo "sua especialidade".
  const espNorm = especialidade ? norm(especialidade)
    : (ctx.especialidade && ctx.especialidade !== 'geral' ? norm(ctx.especialidade) : null);
  const ehDaEspecialidade = (titulo) => {
    if (!espNorm) return false;
    const t = norm(titulo);
    return t === espNorm || t.includes(espNorm) || espNorm.includes(t);
  };
  const gruposContexto = espNorm
    ? [...grupos].sort((a, b) => (ehDaEspecialidade(b.titulo) ? 1 : 0) - (ehDaEspecialidade(a.titulo) ? 1 : 0))
    : grupos;
  const gruposFinais = gruposContexto;

  const contextoRotulo = `${AMBIENTE_ROTULO[ctx.ambiente] || ctx.ambiente} · ${ctx.especialidade === 'geral' ? 'Geral' : ctx.especialidade.replace(/-/g, ' ')}`;

  // Cada clique numa frase ADICIONA direto à Descrição Clínica Atual (qualquer categoria).
  const inserir = (frase) => {
    onInsert.clinical(frase.texto);
    setFlashId(frase.id);
    setTimeout(() => setFlashId(null), 800);
  };

  const criar = async (texto, titulo) => {
    const registro = await base44.entities.FrasePreDefinida.create({
      categoria, texto: texto.trim(), titulo: (titulo || '').trim() || GERAL,
      ambiente: ctx.ambiente,
      especialidade: ctx.especialidade,
    });
    // Regra dura: só entra na lista se o dono for o médico logado.
    if (user && registro?.created_by_id === user.id) {
      queryClient.setQueryData(['frases-predefinidas', user.id], (old = []) => [...old, registro]);
      queryClient.invalidateQueries({ queryKey: ['frases-predefinidas', user.id] });
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
    queryClient.invalidateQueries({ queryKey: ['frases-predefinidas', user.id] });
  };

  if (!user) return null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => updateUi({ aberto: !ui.aberto })}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" /> Evoluções Pré-definidas
          {visiveis > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold normal-case tracking-normal">
              {visiveis}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${ui.aberto ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={() => { setCriando(true); updateUi({ aberto: true }); }}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-border text-primary hover:bg-accent transition-all">
          <Plus className="w-3.5 h-3.5" /> Nova evolução
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
          <div className="flex items-center gap-1.5 -mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              <Filter className="w-3 h-3" /> {contextoRotulo}
            </span>
            <span className="text-[10px] text-muted-foreground">somente evoluções desta área</span>
          </div>

          {criando && (
            <PhraseCreator categoria={categoria} titulos={titulosExistentes} contextoRotulo={contextoRotulo} onCreate={criar} onClose={() => setCriando(false)} />
          )}

          {isLoading ? (
            <p className="text-[11px] text-muted-foreground">Carregando evoluções...</p>
          ) : (
            <>
              {gruposContexto.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Você ainda não tem evoluções salvas neste ambiente/especialidade — crie as suas.
                </p>
              )}
              {gruposFinais.length > 0 && (
                <div className="space-y-1.5">
                  {gruposFinais.map(g => {
                    const aberto = tituloAberto === g.titulo;
                    const daBusca = g.frases.filter(f => !busca || norm(f.texto).includes(norm(busca)));
                    return (
                      <div key={g.titulo}
                        className={`rounded-xl border transition-all ${aberto ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                        <button onClick={() => setTituloAberto(aberto ? null : g.titulo)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
                          <span className="flex-1 min-w-0 text-xs font-extrabold uppercase tracking-wider truncate">{g.titulo}</span>
                          {ehDaEspecialidade(g.titulo) && (
                            <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold normal-case tracking-normal flex-shrink-0">
                              sua especialidade
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex-shrink-0">
                            {g.frases.length}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${aberto ? 'rotate-180' : ''}`} />
                        </button>
                        {aberto && (
                          <div className="px-2.5 pb-2.5 space-y-1.5">
                            {g.frases.length > 3 && (
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar evolução..."
                                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
                              </div>
                            )}
                            {daBusca.length === 0 ? (
                              <p className="text-[11px] text-muted-foreground px-1 py-1">Nenhuma evolução encontrada para a busca.</p>
                            ) : daBusca.map(f => (
                              <div key={f.id}
                                className={`flex items-start gap-1.5 rounded-xl px-3 py-2 border transition-all ${
                                  flashId === f.id
                                    ? 'bg-primary/15 border-primary/40'
                                    : 'border-border hover:border-primary/30'
                                }`}>
                                <button onClick={() => inserir(f)} title="Adicionar à Descrição Clínica Atual"
                                  className="flex-1 min-w-0 text-left text-xs leading-relaxed cursor-pointer">
                                  <Realce texto={f.texto} busca={busca} />
                                </button>
                                {confirmDeleteId === f.id ? (
                                  <button onClick={() => excluir(f)} title="Confirmar exclusão"
                                    className="text-red-500 hover:text-red-400 mt-0.5">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button onClick={() => { setConfirmDeleteId(f.id); setTimeout(() => setConfirmDeleteId(null), 3000); }}
                                    title="Excluir evolução"
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
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Printer, ClipboardCopy, Save, Zap, Eraser, Plus, Check, Pencil, Trash2 } from 'lucide-react';
import { CIRURGIA_DATA } from './CirurgiaPanel';
import AtendimentosMesPanel from './AtendimentosMesPanel';

// Catálogo real de procedimentos (mesma fonte do POP A).
const CATALOGO = CIRURGIA_DATA.identificacao.groups.find(g => g.label === 'Tipo de Procedimento')?.items ?? [];

const EXEMPLO_LICHTENSTEIN = `PROCEDIMENTO: Hernioplastia inguinal à direita (técnica de Lichtenstein)
ANESTESIA: [raquianestesia + sedação]
DECÚBITO: [supino]
ANTISSEPSIA: [PVPI tópico em hipogástrio, região inguinal e coxa direita]

DESCRIÇÃO: Após antissepsia e colocação de campos estéreis, realizada incisão oblíqua de aproximadamente [6 cm], paralela e superior ao ligamento inguinal, com dissecação por planos até a exposição da aponeurose do oblíquo externo. Abertura da aponeurose e dissecção do cordão espermático, com identificação de [hérnia indireta com saco herniário]. Saco herniário dissecado, reduzido e [ligado na base com fio de absorvível 2-0]. Implante de tela de polipropilena [6 x 11 cm], posicionada atrás do cordão espermático e fixada com [sutura contínua de nylon 2-0] ao ligamento inguinal, ao tubérculo púbico e à borda do músculo oblíquo interno, preservando as estruturas do cordão. Revisão cuidadosa da hemostasia. Aproximação da aponeurose do oblíquo externo com [nylon 2-0 contínua], plano subcutâneo com [absorvível 3-0] e pele com [nylon 4-0 em pontos simples]. Curativo oclusivo.

INTERCORRÊNCIAS: [sem intercorrências]
SANGRAMENTO: [mínimo, estimado em __ mL]`;

const EVOLUCAO_PADRAO = `Paciente submetido ao procedimento descrito, sob a anestesia referida. Procedimento realizado sem intercorrências, com sangramento mínimo. Ao final, paciente encaminhado à sala de recuperação pós-anestésica em boas condições, sob monitorização.`;

// Separa as frases de um parágrafo: cada ponto final e cada quebra de linha iniciam um novo item.
const frases = (p) =>
  p.split('\n').flatMap((l) => {
    const out = [];
    let start = 0;
    for (let i = 0; i < l.length; i++) {
      if (l[i] === '.' && (i === l.length - 1 || /\s/.test(l[i + 1]))) {
        out.push(l.slice(start, i + 1).trim());
        start = i + 1;
      }
    }
    if (start < l.length) out.push(l.slice(start).trim());
    return out;
  }).filter(Boolean);

export default function DescricaoCirurgicaEditor() {
  const [procedimento, setProcedimento] = useState('Hernioplastia inguinal');
  const [descricao, setDescricao] = useState(EXEMPLO_LICHTENSTEIN);
  const [evolucao, setEvolucao] = useState(EVOLUCAO_PADRAO);
  const [ap, setAp] = useState(false);
  const [drenos, setDrenos] = useState(false);
  const [selecionado, setSelecionado] = useState(undefined); // id do registro selecionado
  const [renomeando, setRenomeando] = useState(null); // nome do item em edição
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [confirmando, setConfirmando] = useState(null); // nome do item aguardando confirmação de exclusão
  const [flash, setFlash] = useState(''); // 'desc' | 'evol' | 'salvo' | 'erro'

  const avisar = (t) => { setFlash(t); setTimeout(() => setFlash(''), 1400); };
  const queryClient = useQueryClient();

  // Barra pessoal do médico logado: carregada do banco (privada por usuário).
  // Na primeira vez, semeia com o catálogo padrão para o médico começar com a lista completa.
  const { data: itens = [], isLoading: carregandoItens } = useQuery({
    queryKey: ['procedimentos-cirurgicos'],
    queryFn: async () => {
      let list = await base44.entities.ProcedimentoCirurgico.list('created_date', 200);
      if (list.length === 0) {
        list = await base44.entities.ProcedimentoCirurgico.bulkCreate(CATALOGO.map(nome => ({ nome })));
      }
      return list;
    },
  });

  const atualizarCache = (fn) => queryClient.setQueryData(['procedimentos-cirurgicos'], (old = []) => fn(old));

  useEffect(() => {
    if (selecionado === undefined && itens.length > 0) {
      const padrao = itens.find(p => p.nome === 'Hernioplastia inguinal');
      setSelecionado(padrao ? padrao.id : itens[0].id);
    }
  }, [itens]);
  const paragrafos = descricao.split(/\n\s*\n+/).filter(p => p.trim());

  const escolher = (p) => {
    setSelecionado(p.id);
    setProcedimento(p.nome);
    setDescricao(p.descricao || '');
    setEvolucao(p.evolucao || '');
    setAp(!!p.ap);
    setDrenos(!!p.drenos);
  };

  const criarNovo = async () => {
    const nome = procedimento.trim();
    if (nome && !itens.some(p => p.nome === nome)) {
      const criado = await base44.entities.ProcedimentoCirurgico.create({ nome });
      atualizarCache(old => [...old, criado]);
      setSelecionado(criado?.id ?? null);
    } else {
      setSelecionado(null);
    }
    setDescricao('');
    setEvolucao('');
    setAp(false);
    setDrenos(false);
  };

  const iniciarRenome = (id) => {
    setRenomeando(id);
    setNomeEdicao(itens.find(p => p.id === id)?.nome || '');
  };

  const confirmarRenome = async () => {
    const novo = nomeEdicao.trim();
    const id = renomeando;
    const antigo = itens.find(p => p.id === id)?.nome;
    setRenomeando(null);
    if (!novo || novo === antigo || itens.some(p => p.nome === novo)) return;
    try {
      const upd = await base44.entities.ProcedimentoCirurgico.update(id, { nome: novo });
      atualizarCache(old => old.map(p => (p.id === id ? upd : p)));
      if (selecionado === id) setProcedimento(novo);
    } catch (_) {
      avisar('erro');
    }
  };

  const excluir = async (id) => {
    setConfirmando(null);
    atualizarCache(old => old.filter(p => p.id !== id));
    if (selecionado === id) setSelecionado(null);
    try {
      await base44.entities.ProcedimentoCirurgico.delete(id);
    } catch (_) {
      queryClient.invalidateQueries({ queryKey: ['procedimentos-cirurgicos'] });
    }
  };

  const carregarExemplo = () => {
    setProcedimento('Hernioplastia inguinal (Lichtenstein)');
    setDescricao(EXEMPLO_LICHTENSTEIN);
    setEvolucao(EVOLUCAO_PADRAO);
    setSelecionado(itens.find(p => p.nome === 'Hernioplastia inguinal')?.id ?? null);
  };

  const limpar = () => {
    setProcedimento('');
    setDescricao('');
    setEvolucao('');
    setAp(false);
    setDrenos(false);
    setSelecionado(null);
  };

  // Copia APENAS a Descrição da Cirurgia: título + uma frase por linha, em forma de lista.
  const copiarDescricao = async () => {
    const texto = `Descrição da Cirurgia — ${procedimento || 'não definido'}\n\n` +
      paragrafos.map(p => frases(p).map(f => `• ${f}`).join('\n')).join('\n\n') +
      (ap ? `\n\n• AP (anatomopatológico confirmado).` : '') +
      (drenos ? `\n\n• Drenos instalados no ato operatório.` : '');
    try {
      await navigator.clipboard.writeText(texto);
      avisar('desc');
    } catch (_) {
      avisar('erro');
    }
  };

  // Salvar grava a descrição no procedimento selecionado e registra um atendimento do mês.
  const salvar = async () => {
    const nome = procedimento.trim();
    if (!nome) { avisar('erroSalvo'); return; }
    try {
      if (selecionado) {
        // Nome editado no campo também fica salvo no procedimento (sem sobrescrever outro existente).
        const item = itens.find(p => p.id === selecionado);
        const renomear = nome !== item?.nome && !itens.some(p => p.nome === nome);
        const upd = await base44.entities.ProcedimentoCirurgico.update(selecionado, {
          ...(renomear ? { nome } : {}),
          descricao, evolucao, ap, drenos,
        });
        atualizarCache(old => old.map(p => (p.id === selecionado ? upd : p)));
      }
      await base44.entities.AtendimentoCirurgico.create({ procedimento: nome });
      queryClient.invalidateQueries({ queryKey: ['atendimentos-mes'] });
      avisar('salvo');
    } catch (_) {
      avisar('erroSalvo');
    }
  };

  // Evolução padrão é separada: copia somente o texto dela.
  const copiarEvolucao = async () => {
    try {
      await navigator.clipboard.writeText(evolucao.trim());
      avisar('evol');
    } catch (_) {
      avisar('erro');
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0">
      {/* Barra lateral: procedimentos, com rolagem própria */}
      <aside className="md:w-52 flex-shrink-0 border-b md:border-b-0 md:border-r border-border p-3 space-y-2 flex flex-col max-h-[24vh] md:max-h-none min-h-0">
        <AtendimentosMesPanel />
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex-shrink-0">Procedimentos</p>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-primary/35 [&::-webkit-scrollbar-thumb]:rounded-full">
          {carregandoItens && (
            <p className="text-[11px] text-muted-foreground text-center py-4">Carregando...</p>
          )}
          {!carregandoItens && itens.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-4">Nenhum procedimento. Use "Criar novo".</p>
          )}
          {itens.map(p => renomeando === p.id ? (
            <div key={p.id} className="flex items-center gap-1">
              <input
                autoFocus
                value={nomeEdicao}
                onChange={(e) => setNomeEdicao(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmarRenome(); if (e.key === 'Escape') setRenomeando(null); }}
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-muted border border-primary/50 text-xs focus:outline-none"
              />
              <button onClick={confirmarRenome} title="Confirmar nome"
                className="p-1.5 rounded-lg text-primary hover:bg-accent transition-all flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div key={p.id}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                selecionado === p.id
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}>
              <button onClick={() => escolher(p)} title={p.nome} className="flex-1 min-w-0 text-left truncate">{p.nome}</button>
              {confirmando === p.id ? (
                <button onClick={() => excluir(p.id)} title="Confirmar exclusão"
                  className="flex-shrink-0 p-1 rounded-md text-destructive bg-destructive/10 animate-pulse transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              ) : (
                <>
                  <button onClick={() => iniciarRenome(p.id)} title="Renomear"
                    className="flex-shrink-0 p-1 rounded-md hover:text-foreground hover:bg-accent transition-all">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => { setConfirmando(p.id); setTimeout(() => setConfirmando(null), 3000); }} title="Excluir"
                    className="flex-shrink-0 p-1 rounded-md hover:text-destructive hover:bg-destructive/10 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <button onClick={criarNovo}
          className="flex-shrink-0 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all btn-press">
          <Plus className="w-3.5 h-3.5" /> Criar novo
        </button>
      </aside>

      {/* Editor */}
      <section className="flex-1 min-w-0 overflow-y-auto p-4 space-y-3 border-b md:border-b-0 md:border-r border-border [scrollbar-width:thin]">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Procedimento</label>
          <input
            type="text"
            value={procedimento}
            onChange={(e) => setProcedimento(e.target.value)}
            placeholder="Ex.: Hernioplastia inguinal (Lichtenstein)"
            className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição da Cirurgia</label>
          <textarea
            rows={12}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Procedimento, anestesia, decúbito, antissepsia, descrição passo a passo, intercorrências, sangramento..."
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-y focus:outline-none focus:border-primary/50 transition-all font-mono text-xs leading-relaxed"
          />
        </div>

        {/* Evolução padrão separada, com sua própria cópia */}
        <div className="pt-3 border-t border-border space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evolução padrão</label>
            <button onClick={copiarEvolucao}
              className="flex items-center gap-1 text-[10px] font-bold text-primary border border-primary/40 rounded-lg px-2 py-1 hover:bg-accent transition-all">
              <ClipboardCopy className="w-3 h-3" /> Copiar
            </button>
          </div>
          <textarea
            rows={4}
            value={evolucao}
            onChange={(e) => setEvolucao(e.target.value)}
            placeholder="Evolução padrão que acompanha a descrição..."
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-y focus:outline-none focus:border-primary/50 transition-all"
          />
          {flash === 'evol' && <span className="text-xs font-bold text-primary">✓ Copiado</span>}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={ap} onChange={(e) => setAp(e.target.checked)}
              className="w-4 h-4 accent-[hsl(var(--primary))]" />
            AP (anatomopatológico confirmado)
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={drenos} onChange={(e) => setDrenos(e.target.checked)}
              className="w-4 h-4 accent-[hsl(var(--primary))]" />
            Drenos instalados
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button onClick={salvar}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all btn-press">
            <Save className="w-3.5 h-3.5" /> Salvar
          </button>
          <button onClick={carregarExemplo}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-primary/40 text-primary text-xs font-bold hover:bg-accent transition-all">
            <Zap className="w-3.5 h-3.5" /> Exemplo Lichtenstein
          </button>
          <button onClick={limpar}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <Eraser className="w-3.5 h-3.5" /> Limpar
          </button>
          {flash === 'salvo' && <span className="text-xs font-bold text-primary">✓ Salvo</span>}
        </div>
      </section>

      {/* Pré-visualização (atualiza a cada tecla) — descrição em lista, uma frase por linha */}
      <section className="flex-1 min-w-0 flex flex-col min-h-0 p-4 space-y-3">
        <div className="flex-1 min-h-0 overflow-y-auto glass-card rounded-2xl p-5 print-area space-y-4 [scrollbar-width:thin]">
          <h3 className="text-sm font-extrabold break-words">
            Descrição da Cirurgia — <span className="text-primary">{procedimento || 'não definido'}</span>
          </h3>
          {paragrafos.length > 0 ? (
            paragrafos.map((p, i) => (
              <ul key={i} className="list-disc pl-5 space-y-1.5">
                {frases(p).map((f, j) => (
                  <li key={j} className="text-sm text-foreground leading-relaxed">{f}</li>
                ))}
              </ul>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem descrição — escreva no editor à esquerda.</p>
          )}
          {ap && (
            <ul className="list-disc pl-5">
              <li className="text-sm text-foreground leading-relaxed">AP (anatomopatológico confirmado).</li>
            </ul>
          )}
          {drenos && (
            <ul className="list-disc pl-5">
              <li className="text-sm text-foreground leading-relaxed">Drenos instalados no ato operatório.</li>
            </ul>
          )}
          {evolucao.trim() && (
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Evolução (padrão)</p>
                <button onClick={copiarEvolucao}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary border border-primary/40 rounded-lg px-2 py-1 hover:bg-accent transition-all flex-shrink-0">
                  <ClipboardCopy className="w-3 h-3" /> Copiar
                </button>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{evolucao}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <button onClick={copiarDescricao}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all btn-press">
            <ClipboardCopy className="w-3.5 h-3.5" /> Copiar (prontuário)
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-primary/40 text-primary text-xs font-bold hover:bg-accent transition-all">
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
          {flash === 'desc' && <span className="text-xs font-bold text-primary">✓ Copiado</span>}
          {flash === 'erro' && <span className="text-xs font-bold text-destructive">Não foi possível copiar</span>}
          {flash === 'erroSalvo' && <span className="text-xs font-bold text-destructive">Não foi possível salvar</span>}
        </div>
      </section>
    </div>
  );
}
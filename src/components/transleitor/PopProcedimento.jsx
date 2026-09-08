import React, { useState } from 'react';
import { Search, X, Check, Plus } from 'lucide-react';
import { CIRURGIA_DATA } from './CirurgiaPanel';

// Catálogo REAL de procedimentos: grupo "Tipo de Procedimento" do CirurgiaPanel.
const CATALOGO = CIRURGIA_DATA.identificacao.groups.find(g => g.label === 'Tipo de Procedimento')?.items ?? [];

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function PopProcedimento({ onUsar, onClose }) {
  const [selecionados, setSelecionados] = useState([]);
  const [customs, setCustoms] = useState([]);
  const [busca, setBusca] = useState('');
  const [outro, setOutro] = useState('');
  const [flash, setFlash] = useState(''); // 'copiado' | 'usado' | 'erro' | 'vazio'

  const linhas = [...selecionados, ...customs];
  const filtrados = CATALOGO.filter(p => norm(p).includes(norm(busca)));

  const avisar = (tipo) => { setFlash(tipo); setTimeout(() => setFlash(''), 1400); };

  const toggle = (item) =>
    setSelecionados(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]));

  const adicionarOutro = () => {
    const nome = outro.trim();
    if (!nome) return;
    if (!linhas.includes(nome)) {
      if (CATALOGO.includes(nome)) toggle(nome);
      else setCustoms(prev => [...prev, nome]);
    }
    setOutro('');
  };

  const copiar = async () => {
    if (!linhas.length) { avisar('vazio'); return; }
    try {
      await navigator.clipboard.writeText(linhas.join('\n'));
      avisar('copiado');
    } catch (_) {
      avisar('erro');
    }
  };

  const usar = () => {
    if (!linhas.length) { avisar('vazio'); return; }
    onUsar(linhas[0]);
    avisar('usado');
  };

  const limpar = () => {
    setSelecionados([]);
    setCustoms([]);
    setBusca('');
    setOutro('');
    setFlash('');
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Cabeçalho: título + busca */}
          <div className="px-5 py-4 border-b border-border flex-shrink-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold flex items-center gap-2">🔍 Procedimento Cirúrgico</h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar procedimento..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted border border-border text-xs focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Corpo com rolagem: lista um procedimento por linha */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-primary/35 [&::-webkit-scrollbar-thumb]:rounded-full">
            {filtrados.map(p => {
              const ativo = selecionados.includes(p);
              return (
                <button key={p} onClick={() => toggle(p)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-left text-sm transition-all ${
                    ativo
                      ? 'border-primary/40 bg-primary/10 text-primary font-bold'
                      : 'border-border text-foreground hover:border-primary/30 hover:bg-accent/50'
                  }`}>
                  <span>{p}</span>
                  {ativo && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
            {filtrados.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum procedimento encontrado — use o campo abaixo para digitar.</p>
            )}

            {/* Outro procedimento (digitar) */}
            <div className="pt-3 mt-2 border-t border-border">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Outro procedimento (digitar)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={outro}
                  onChange={(e) => setOutro(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarOutro(); } }}
                  placeholder="Ex.: Hernioplastia umbilical com tela..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all"
                />
                <button onClick={adicionarOutro} title="Adicionar"
                  className="px-3 rounded-xl border border-border text-primary hover:bg-accent transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Selecionados: um por linha */}
            {linhas.length > 0 && (
              <div className="mt-3 rounded-xl bg-muted border border-border p-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Selecionados</p>
                {linhas.map(l => (
                  <p key={l} className="text-xs text-foreground whitespace-pre-wrap">{l}</p>
                ))}
              </div>
            )}

            {flash && (
              <p className={`text-[11px] font-semibold text-center pt-2 ${
                flash === 'erro' || flash === 'vazio' ? 'text-destructive' : 'text-primary'
              }`}>
                {flash === 'copiado' && 'Copiado para a área de transferência'}
                {flash === 'usado' && 'Definido como procedimento do módulo'}
                {flash === 'vazio' && 'Selecione ou digite um procedimento primeiro'}
                {flash === 'erro' && 'Não foi possível copiar para a área de transferência'}
              </p>
            )}
          </div>

          {/* Rodapé: ações */}
          <div className="px-5 py-4 border-t border-border flex-shrink-0 flex flex-wrap items-center justify-end gap-2">
            <button onClick={copiar}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all btn-press">
              📋 Copiar para o prontuário
            </button>
            <button onClick={usar}
              className="px-4 py-2.5 rounded-xl border border-primary/40 text-primary text-xs font-bold hover:bg-accent transition-all">
              ✓ Usar como procedimento do módulo
            </button>
            <button onClick={limpar}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
              🧹 Limpar
            </button>
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
              ✕ Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
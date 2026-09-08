import React from 'react';
import { X, Loader2, Zap } from 'lucide-react';

export default function PopEvolucao({
  reg, iaSelecionada, setIaSelecionada, deepseekId,
  gerando, salvando, erro, flash,
  onGerar, onEditarContexto, onSetAp, onEditarResultado, onCopiar, onSalvar, onClose,
}) {
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border flex-shrink-0">
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Evolução de Pós-Operatório
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Corpo com rolagem */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-primary/35 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* Seletor de IA */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gerar com:</span>
                <button onClick={() => setIaSelecionada('base44')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    iaSelecionada === 'base44' ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}>
                  IA do Base44
                </button>
                {deepseekId && (
                  <button onClick={() => setIaSelecionada('deepseek')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      iaSelecionada === 'deepseek' ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}>
                    DeepSeek
                  </button>
                )}
              </div>
              {iaSelecionada === 'deepseek' && (
                <p className="text-[11px] text-muted-foreground">DeepSeek usa sua chave (não consome os créditos do Base44).</p>
              )}
            </div>

            {/* Procedimento atual */}
            <div className="rounded-xl bg-muted border border-border px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Procedimento atual</p>
              <p className={`text-sm font-bold mt-0.5 ${reg.procedimento ? '' : 'text-muted-foreground italic'}`}>
                {reg.procedimento || 'não definido — escolha no Card 1'}
              </p>
            </div>

            {/* Contexto da evolução */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contexto da evolução</label>
              <textarea
                rows={7}
                value={reg.evolucao}
                onChange={(e) => onEditarContexto(e.target.value)}
                placeholder="Monte o contexto: queixas, aceitação de dieta, ferida operatória, drenos, sinais vitais... Inclua o encaminhamento à sala de recuperação."
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-y overflow-y-auto focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            {/* Confirmação AP */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground">Confirmação AP:</span>
              <div className="flex gap-1 bg-muted rounded-xl p-1 border border-border">
                <button onClick={() => onSetAp(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    reg.ap === true ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  Sim
                </button>
                <button onClick={() => onSetAp(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    reg.ap === false ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  Não
                </button>
              </div>
            </div>

            {/* Gerar */}
            <button onClick={onGerar} disabled={gerando}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 btn-press ${
                gerando
                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}>
              {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {gerando ? 'Gerando evolução...' : 'Gerar evolução'}
            </button>

            {erro && <p className="text-xs text-destructive text-center">{erro}</p>}

            {/* Resultado editável */}
            {reg.resultado && (
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Evolução gerada (editável{reg.fonte ? ` · ${reg.fonte}` : ''})
                </label>
                <textarea
                  rows={9}
                  value={reg.resultado}
                  onChange={(e) => onEditarResultado(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-y overflow-y-auto focus:outline-none focus:border-primary/50 transition-all whitespace-pre-wrap"
                />
                {flash && (
                  <p className="text-[11px] text-primary font-semibold text-center">
                    {flash === 'copiado' ? 'Copiado para a área de transferência' : flash === 'salvo' ? 'Registro salvo' : ''}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Rodapé: ações */}
          <div className="px-5 py-4 border-t border-border flex-shrink-0 flex flex-wrap items-center justify-end gap-2">
            <button onClick={onCopiar} disabled={!reg.resultado}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-all btn-press">
              📋 Copiar (prontuário)
            </button>
            <button onClick={onSalvar} disabled={salvando || !reg.resultado}
              className="px-4 py-2.5 rounded-xl border border-primary/40 text-primary text-xs font-bold hover:bg-accent disabled:opacity-40 transition-all">
              💾 {salvando ? 'Salvando...' : 'Salvar'}
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
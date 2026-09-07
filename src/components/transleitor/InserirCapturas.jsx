import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileStack, X, Loader2, FlaskConical, Activity } from 'lucide-react';

const fmtDate = (d) => new Date(d).toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

// Anexa o texto extraído ao campo atual, separando blocos por linha.
const appendExtracao = (atual, texto) => {
  const base = (atual || '').trimEnd();
  if (!base) return texto;
  const ultimo = base.slice(-1);
  const sep = ['.', ';', '\n'].includes(ultimo) ? '\n' : '.\n';
  return base + sep + texto;
};

export default function InserirCapturas({ formData, setFormData }) {
  const [open, setOpen] = useState(false);
  const [destino, setDestino] = useState('labs');
  const [erro, setErro] = useState('');
  const queryClient = useQueryClient();

  const { data: pendentes = [], isLoading } = useQuery({
    queryKey: ['exam-attachments', 'pendente'],
    queryFn: () => base44.entities.ExamAttachment.filter({ status: 'pendente' }, '-created_date', 50),
  });

  const inserir = async (c) => {
    const campo = destino === 'labs' ? 'labs' : 'clinicalDescription';
    setFormData(prev => ({ ...prev, [campo]: appendExtracao(prev[campo], c.extracao) }));
    setOpen(false);
    try {
      await base44.entities.ExamAttachment.update(c.id, { status: 'inserida' });
    } catch (_) {
      setErro('A captura foi inserida, mas não foi possível retirá-la da fila.');
    }
    queryClient.invalidateQueries({ queryKey: ['exam-attachments'] });
  };

  return (
    <>
      <button
        onClick={() => { setErro(''); setOpen(true); }}
        title="Inserir capturas de laudo/exame pendentes"
        className="relative text-xs font-semibold px-2.5 py-1 rounded-lg border border-border text-primary hover:bg-accent transition-all flex items-center gap-1.5"
      >
        <FileStack className="w-3.5 h-3.5" /> Inserir capturas
        {pendentes.length > 0 && (
          <span className="min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {pendentes.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg max-h-[82vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-sm font-extrabold flex items-center gap-2">
                    <FileStack className="w-4 h-4 text-primary" /> Inserir capturas
                  </h2>
                  <p className="text-xs text-muted-foreground">Laudos e exames capturados e ainda não inseridos</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 pt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Destino do texto</p>
                <div className="flex gap-1 bg-muted rounded-xl p-1">
                  <button onClick={() => setDestino('labs')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${destino === 'labs' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
                    <FlaskConical className="w-3.5 h-3.5" /> Exames Complementares
                  </button>
                  <button onClick={() => setDestino('clinical')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${destino === 'clinical' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Activity className="w-3.5 h-3.5" /> Descrição Clínica
                  </button>
                </div>
                {erro && <p className="text-[11px] text-destructive mt-2">{erro}</p>}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-xs">Carregando capturas...</p>
                  </div>
                ) : pendentes.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs text-muted-foreground">Nenhuma captura pendente.</p>
                    <button onClick={() => setOpen(false)}
                      className="text-xs font-semibold text-primary hover:underline">
                      📄 Capturar laudo/exame
                    </button>
                  </div>
                ) : pendentes.map(c => (
                  <button key={c.id} onClick={() => inserir(c)}
                    className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-all space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {c.tipo === 'laudo' ? '📄 Laudo' : '🧪 Exame'}
                      </span>
                      <span>{c.tipo_arquivo === 'pdf' ? 'PDF' : 'Imagem'}</span>
                      <span className="font-semibold">{fmtDate(c.created_date)}</span>
                    </div>
                    <p className="text-xs text-foreground/80 line-clamp-3 whitespace-pre-wrap">{c.extracao}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
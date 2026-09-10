import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Camera, Image as ImageIcon, FileUp, Loader2, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { fileToDataUrl, fileToRawDataUrl } from '@/lib/imageCompress';

const TIPO_LABEL = { laudo: 'Laudo', exame: 'Exame' };
const fmtDate = (d) => new Date(d).toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default function Capturas() {
  const [tipo, setTipo] = useState('exame');
  const [capturando, setCapturando] = useState(false);
  const [etapa, setEtapa] = useState('');
  const [erro, setErro] = useState('');
  const [confirmarId, setConfirmarId] = useState(null);
  const queryClient = useQueryClient();

  const { data: capturas = [], isLoading } = useQuery({
    queryKey: ['exam-attachments'],
    queryFn: () => base44.entities.ExamAttachment.list('-created_date', 100),
  });
  const pendentes = capturas.filter(c => c.status === 'pendente');
  const inseridas = capturas.filter(c => c.status === 'inserida');

  // A fila atualiza ao vivo (capturas criadas em outro dispositivo/sessão incluídas),
  // sem depender de recarregar a página.
  useEffect(() => {
    const unsubscribe = base44.entities.ExamAttachment.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['exam-attachments'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const processar = async (e, ehPdf) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErro(''); setCapturando(true);
    try {
      let extracao = '';
      let arquivoUrl = '';
      let resp = null;
      if (ehPdf) {
        setEtapa('Enviando PDF...');
        let payload = null;
        try {
          const up = await base44.integrations.Core.UploadFile({ file });
          arquivoUrl = up?.file_url || '';
          payload = { file_url: arquivoUrl, tipo };
        } catch (_) {
          // Sem créditos de integração da plataforma: envia o PDF direto e a
          // extração roda com a DeepSeek (créditos próprios do médico).
          setEtapa('Enviando PDF (modo DeepSeek)...');
          payload = { pdf_data_url: await fileToRawDataUrl(file), tipo };
        }
        setEtapa('Extraindo texto com IA...');
        resp = await base44.functions.invoke('extrairCaptura', payload);
        extracao = resp?.data?.text;
      } else {
        if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem válido.');
        setEtapa('Extraindo texto com IA...');
        const imageDataUrl = await fileToDataUrl(file);
        resp = await base44.functions.invoke('extrairCaptura', { image_data_url: imageDataUrl, tipo });
        extracao = resp?.data?.text;
        // Armazenamento do arquivo é best-effort: falha não bloqueia a captura.
        try {
          const up = await base44.integrations.Core.UploadFile({ file });
          arquivoUrl = up?.file_url || '';
        } catch (_) { arquivoUrl = ''; }
      }
      if (!extracao) throw new Error(resp?.data?.error || 'A extração não retornou texto.');
      await base44.entities.ExamAttachment.create({
        arquivo_url: arquivoUrl,
        tipo,
        tipo_arquivo: ehPdf ? 'pdf' : 'imagem',
        extracao,
        status: 'pendente',
      });
      queryClient.invalidateQueries({ queryKey: ['exam-attachments'] });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Erro ao capturar o documento.';
      setErro(`${msg} Se persistir, pode ser limitação de créditos de integração do workspace.`);
    } finally {
      setCapturando(false); setEtapa('');
    }
  };

  const excluir = async (c) => {
    if (confirmarId !== c.id) { setConfirmarId(c.id); return; }
    setConfirmarId(null);
    try {
      await base44.entities.ExamAttachment.delete(c.id);
      queryClient.invalidateQueries({ queryKey: ['exam-attachments'] });
    } catch (_) {
      setErro('Não foi possível excluir a captura.');
    }
  };

  const renderCard = (c, pendente) => (
    <div key={c.id} className={`p-3 rounded-xl border transition-all ${pendente ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
        <span className={`px-2 py-0.5 rounded-full font-bold ${pendente ? 'bg-primary/15 text-primary' : 'bg-emerald-500/15 text-emerald-500'}`}>
          {pendente ? <Clock className="w-3 h-3 inline mr-1 -mt-0.5" /> : <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />}
          {pendente ? 'Na fila' : 'Inserida'}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-accent font-bold">{TIPO_LABEL[c.tipo] || c.tipo}</span>
        {c.tipo_arquivo === 'pdf' ? <span>📄 PDF</span> : <ImageIcon className="w-3 h-3" />}
        <span className="font-semibold">{fmtDate(c.created_date)}</span>
        <button
          onClick={() => excluir(c)}
          title={confirmarId === c.id ? 'Confirmar exclusão' : 'Excluir'}
          className={`ml-auto p-1.5 rounded-lg transition-all ${confirmarId === c.id ? 'bg-destructive/15 text-destructive' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-foreground/80 line-clamp-2 mt-2 whitespace-pre-wrap">{c.extracao}</p>
      {confirmarId === c.id && (
        <p className="text-[11px] text-destructive mt-1.5">Clique novamente na lixeira para confirmar.</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <Link to="/transleitor" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-lg">📄</span>
          <h1 className="text-lg font-extrabold tracking-tight">Capturar laudo/exame</h1>
        </div>
        {pendentes.length > 0 && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
            {pendentes.length} na fila
          </span>
        )}
      </header>

      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        {/* Captura em destaque */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-extrabold">Nova captura</h2>
            <div className="flex bg-muted rounded-xl p-1 gap-1">
              <button onClick={() => setTipo('laudo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tipo === 'laudo' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
                📄 Laudo
              </button>
              <button onClick={() => setTipo('exame')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tipo === 'exame' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
                🧪 Exame
              </button>
            </div>
          </div>

          {capturando ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 py-10 flex flex-col items-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm font-semibold text-primary">{etapa || 'Processando...'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="cursor-pointer rounded-xl bg-primary text-primary-foreground py-4 px-3 flex flex-col items-center gap-1.5 shadow-lg btn-press">
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => processar(e, false)} />
                <Camera className="w-6 h-6" />
                <span className="text-sm font-bold">Fotografar</span>
                <span className="text-[10px] opacity-80">câmera do celular</span>
              </label>
              <label className="cursor-pointer rounded-xl border-2 border-primary/40 text-primary py-4 px-3 flex flex-col items-center gap-1.5 hover:bg-primary/10 transition-all btn-press">
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => processar(e, false)} />
                <ImageIcon className="w-6 h-6" />
                <span className="text-sm font-bold">Galeria / Arquivo</span>
                <span className="text-[10px] opacity-70">imagem salva</span>
              </label>
              <label className="cursor-pointer rounded-xl border border-border text-muted-foreground py-4 px-3 flex flex-col items-center gap-1.5 hover:border-primary/30 hover:text-primary transition-all btn-press">
                <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => processar(e, true)} />
                <FileUp className="w-6 h-6" />
                <span className="text-sm font-bold">PDF</span>
                <span className="text-[10px] opacity-70">documento digitalizado</span>
              </label>
            </div>
          )}
          {erro && <p className="text-xs text-destructive text-center">{erro}</p>}
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            A extração por IA anonimiza os dados do paciente. A captura fica na sua fila — insira depois em qualquer evolução, sem precisar abrir o paciente agora.
          </p>
        </div>

        {/* Fila de capturas */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-xs">Carregando capturas...</p>
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Na fila ({pendentes.length})
              </h3>
              {pendentes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhuma captura pendente. Use os botões acima para fotografar um laudo ou exame.
                </p>
              ) : pendentes.map(c => renderCard(c, true))}
            </section>

            {inseridas.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Inseridas ({inseridas.length})
                </h3>
                {inseridas.map(c => renderCard(c, false))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
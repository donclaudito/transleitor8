import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ScanLine, Upload, Wand2, Copy, X, Loader2, ChevronLeft, ImageIcon } from 'lucide-react';

const DEFAULT_PROMPT = `Você é um assistente médico especialista em imagem. Examine a imagem médica fornecida e analise:
1. Identifique o tipo de exame e a região anatômica mostrada.
2. Descreva o delineamento das estruturas, simetria e qualidade técnica da imagem.
3. Identifique alterações: consolidações, infiltrados, derrame pleural, nódulos, fraturas, massas, calcificações, etc.
4. Sintetize o achado principal e sugira diagnósticos diferenciais por ordem de probabilidade.
Use terminologia médica brasileira formal. NÃO invente achados não visíveis. Se a imagem não for médica ou for inadequada, diga explicitamente.
Formate a resposta em HTML semântico: <p>, <strong>, <ul>/<li>, <br>. NÃO use Markdown (sem ##, **, -).`;

const MODALITY_PRESETS = [
  { label: 'Raio-X Tórax', prompt: `Examine a imagem radiográfica de tórax e analise: delineamento pulmonar e seios costofrênicos, consolidações/infiltrados/derrame pleural, silhouette cardíaca, hilos, partes moles e dispositivos. Sintetize o achado principal.` },
  { label: 'Raio-X Abdome', prompt: `Examine a imagem radiográfica de abdome e analise: dilatação de alças, níveis hidroaéreos, calcificações, massas, pneumoperitônio (sinal do aleijão), gases intra e extraluminais. Sintetize o achado principal.` },
  { label: 'Tomografia', prompt: `Examine a imagem tomográfica fornecida e analise: densidades, realce, estruturas anatômicas da região, lesões focais, coleções, linfonodos, etc. Sintetize o achado principal.` },
  { label: 'USG', prompt: `Examine a imagem ultrassonográfica e analise: ecogenicidade, contornos, medidas aparentes, líquidos livres, massas/cistos, cálculos. Sintetize o achado principal.` },
  { label: 'Genérico', prompt: DEFAULT_PROMPT },
];

export default function ImagemMedica() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Selecione um arquivo de imagem válido.'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(''); setError('');
  };

  const removeFile = () => {
    setFile(null); setPreview('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const analyze = async () => {
    if (!file) { setError('Selecione uma imagem primeiro.'); return; }
    setLoading(true); setError(''); setResult('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const text = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        model: 'gemini_3_flash',
      });
      setResult(typeof text === 'string' ? text : JSON.stringify(text));
    } catch (err) {
      setError(err?.message || 'Erro ao analisar a imagem.');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(result);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <Link to="/" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-extrabold tracking-tight">Análise de Imagem Médica</h1>
        </div>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
          <ImageIcon className="w-3 h-3" /> Gemini Vision
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Coluna de entrada */}
        <div className="overflow-y-auto border-r border-border p-4 md:p-6 space-y-6">
          {/* Upload */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" /> Imagem Médica
            </h3>
            {preview ? (
              <div className="relative group">
                <img src={preview} alt="preview" className="w-full rounded-xl max-h-80 object-contain bg-black/5" />
                <button onClick={removeFile}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur border border-border text-muted-foreground hover:text-destructive transition-all">
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-muted-foreground mt-2 truncate">{file?.name}</p>
              </div>
            ) : (
              <button onClick={() => inputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl py-10 flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Enviar imagem</span>
                <span className="text-[11px]">Raio-X, TC, USG, RM — JPG/PNG</span>
              </button>
            )}
            <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          </div>

          {/* Modalidade */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Modalidade (presets)</h3>
            <div className="flex flex-wrap gap-2">
              {MODALITY_PRESETS.map(m => (
                <button key={m.label} onClick={() => setPrompt(`${m.prompt}\n\nFormate em HTML semântico (<p>, <strong>, <ul>/<li>, <br>), sem Markdown.`)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-all">
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prompt de análise</h3>
            <textarea rows={8} value={prompt} onChange={e => setPrompt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-y focus:outline-none focus:border-primary/50 transition-all" />
          </div>

          <button onClick={analyze} disabled={loading || !file}
            className="w-full py-4 rounded-2xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg btn-press">
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analisando imagem...</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Analisar Imagem</>
            )}
          </button>
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
        </div>

        {/* Coluna de resultado */}
        <div className={`overflow-y-auto p-4 md:p-6 transition-colors duration-500 ${result && !loading ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Analisando imagem com IA...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Laudo sugerido</h3>
                <button onClick={copy}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${copied ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-500' : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
                  <Copy className="w-3.5 h-3.5" /> {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <div className="glass-card rounded-2xl p-6">
                {hasHtml ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1.5 [&_ul]:my-2 [&_li]:my-0.5 [&_strong]:text-foreground"
                    dangerouslySetInnerHTML={{ __html: result }} />
                ) : (
                  <pre className="text-sm whitespace-pre-wrap font-sans">{result}</pre>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                <ScanLine className="w-7 h-7" />
              </div>
              <h3 className="font-bold mb-1">Laudo de imagem</h3>
              <p className="text-sm max-w-xs">Envie uma imagem médica e clique em <strong className="text-primary">Analisar Imagem</strong> para gerar o laudo sugerido.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useRef, useState } from 'react';
import { Camera, Loader2, Lock, FlaskConical, Activity, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

// Captura de laudos/exames pela câmera: foto → redimensiona → upload → extração
// via função extractExamText (anonimização LGPD obrigatória) → persistência em
// ExamAttachment → resultado editável com selo "🔒 Anonimizado" e inserção no
// formulário ("Exames" ou "Descrição Clínica").
export default function LaudoCaptureButton({ onInsert, evolutionId = null }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { id, extracao, examType }
  const { toast } = useToast();

  // Redimensiona a foto (decode fora da thread principal) para upload leve.
  const downscaleImage = async (file) => {
    if (!file.type?.startsWith('image/')) return file;
    try {
      const bitmap = await window.createImageBitmap(file);
      let { width, height } = bitmap;
      const MAX = 1600;
      if (width > MAX || height > MAX) {
        const scale = Math.min(MAX / width, MAX / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.8));
      if (!blob) return file;
      const name = (file.name || 'exame').replace(/\.\w+$/, '.jpg');
      return new File([blob], name, { type: 'image/jpeg' });
    } catch {
      return file;
    }
  };

  const withTimeout = (promise, ms, msg) =>
    Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms))]);

  const handleFile = async (file) => {
    if (!file || loading) return;
    setLoading(true);
    try {
      const optimized = await downscaleImage(file);
      const upload = await withTimeout(
        base44.integrations.Core.UploadFile({ file: optimized }),
        30000,
        'Upload da foto demorou demais. Tente novamente em rede estável.'
      );
      const { file_url } = upload;
      const res = await withTimeout(
        base44.functions.invoke('extractExamText', { file_url }),
        60000,
        'A extração demorou demais. Tente novamente com uma foto mais nítida.'
      );
      const data = res?.data;
      if (!data?.extracao) throw new Error(data?.error || 'Não foi possível extrair o texto do exame.');
      const record = await base44.entities.ExamAttachment.create({
        file_name: optimized.name || 'exame.jpg',
        file_url,
        extraction: data.extracao,
        exam_type: data.exam_type || '',
        is_anonymous: true,
        target_field: null,
        evolution_id: evolutionId,
      });
      setResult({ id: record.id, extracao: data.extracao, examType: data.exam_type || '' });
      toast({ title: 'Exame extraído e anonimizado', description: 'Revise o texto antes de inserir no formulário.' });
    } catch (e) {
      toast({
        title: 'Erro na captura do exame',
        description: e?.response?.data?.error || e?.message || 'Falha ao processar a imagem.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleInsert = async (field) => {
    if (!result?.extracao?.trim()) return;
    onInsert?.(field, result.extracao.trim());
    try {
      // Persiste a versão editada e o campo de destino.
      await base44.entities.ExamAttachment.update(result.id, {
        extraction: result.extracao.trim(),
        exam_type: result.examType,
        target_field: field,
      });
    } catch { /* persistência do destino é best-effort */ }
    toast({ title: field === 'labs' ? 'Inserido em Exames Complementares' : 'Inserido na Descrição Clínica' });
  };

  return (
    <div className="space-y-2">
      <label
        title="Fotografar exame/laudo — extração com anonimização LGPD"
        className={`relative w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold premium-gradient-soft text-primary border border-primary/20 transition-all btn-press ${loading ? 'opacity-50 pointer-events-none' : 'hover:border-primary/40 cursor-pointer'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        {loading ? 'Extraindo e anonimizando...' : '📷 Capturar Exame (foto com anonimização)'}
      </label>

      {result && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Anonimizado — identificadores removidos (LGPD)
            </span>
            <button onClick={() => setResult(null)} title="Descartar extração"
              className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            value={result.examType}
            onChange={(e) => setResult(prev => ({ ...prev, examType: e.target.value }))}
            placeholder="Tipo de exame (ex: Laboratorial, TC, US...)"
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-xs focus:outline-none focus:border-primary/50 transition-all"
          />
          <textarea
            rows={6}
            value={result.extracao}
            onChange={(e) => setResult(prev => ({ ...prev, extracao: e.target.value }))}
            placeholder="Texto extraído do exame..."
            className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-xs resize-y focus:outline-none focus:border-primary/50 transition-all"
          />
          <div className="flex gap-2">
            <button onClick={() => handleInsert('labs')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all">
              <FlaskConical className="w-3.5 h-3.5" /> Inserir em Exames
            </button>
            <button onClick={() => handleInsert('clinicalDescription')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold bg-accent text-accent-foreground border border-accent-foreground/15 hover:opacity-80 transition-all">
              <Activity className="w-3.5 h-3.5" /> Inserir na Descrição
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
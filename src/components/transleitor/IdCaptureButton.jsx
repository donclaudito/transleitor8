import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

const SYSTEM_PROMPT = `Você é um módulo especialista de OCR e extração de dados clínicos para a interface do aplicativo. Sua única função é processar fotos ou textos de identificação de pacientes (crachá, pulseira de identificação, ficha de internação ou placa de leito) e retornar os dados padronizados.

REGRAS:
- primeiro_nome: extraia APENAS o primeiro nome do paciente. Remova abreviações, títulos (Dr., Sr., Sra.) e sobrenomes. Formate em Title Case (ex: "JOÃO SILVA SOBRINHO" -> "João").
- leito: identifique e extraia o número/código do leito ou quarto. Remova palavras como "Leito", "Quarto", "UTI", mantendo apenas a identificação alfanumérica limpa (ex: "Leito 204-B" -> "204-B").
- Se a imagem estiver ilegível ou faltar alguma informação, retorne o campo correspondente como null e status "error" com uma mensagem clara pedindo nova captura.

Responda ESTRITAMENTE no formato JSON abaixo, sem texto explicativo adicional.`;

const SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['success', 'error'] },
    data: {
      type: 'object',
      properties: {
        primeiro_nome: { type: ['string', 'null'] },
        leito: { type: ['string', 'null'] },
      },
    },
    ui_action: {
      type: 'object',
      properties: {
        icon_active: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
  required: ['status', 'data'],
};

export default function IdCaptureButton({ onExtract }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Redimensiona a foto usando createImageBitmap (decode fora da thread principal,
  // evita congelar a tela com fotos grandes de celular). Fallback p/ imagem original.
  const downscaleImage = async (file) => {
    if (!file.type?.startsWith('image/')) return file;
    try {
      const bitmap = await window.createImageBitmap(file);
      let { width, height } = bitmap;
      const MAX = 1280;
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
      const name = (file.name || 'capture').replace(/\.\w+$/, '.jpg');
      return new File([blob], name, { type: 'image/jpeg' });
    } catch {
      return file;
    }
  };

  const withTimeout = (promise, ms, msg) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
    ]);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const optimized = await downscaleImage(file);
      const upload = await withTimeout(
        base44.integrations.Core.UploadFile({ file: optimized }),
        30000,
        'Upload da foto demorou demais. Tente novamente em rede estável.'
      );
      const { file_url } = upload;
      const result = await withTimeout(
        base44.integrations.Core.InvokeLLM({
          prompt: SYSTEM_PROMPT,
          file_urls: [file_url],
          response_json_schema: SCHEMA,
          model: 'gemini_3_flash',
        }),
        45000,
        'A leitura da imagem demorou demais. Tire uma foto mais nítida e tente novamente.'
      );

      const primeiroNome = result?.data?.primeiro_nome ?? null;
      const leito = result?.data?.leito ?? null;
      const message = result?.ui_action?.message ||
        (result?.status === 'error' ? 'Não foi possível extrair os dados. Tire uma nova foto.' : 'Identificação do paciente extraída com sucesso.');

      if (result?.status === 'error' || (!primeiroNome && !leito)) {
        toast({ title: 'Captura incompleta', description: message, variant: 'destructive' });
        return;
      }
      onExtract?.({ primeiro_nome: primeiroNome, leito });
      toast({ title: 'Paciente identificado', description: message });
    } catch (e) {
      toast({ title: 'Erro na captura', description: e?.message || 'Falha ao processar a imagem.', variant: 'destructive' });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <label
      title="Capturar identificação do paciente (foto do crachá/pulseira)"
      className={`relative px-2.5 py-1.5 rounded-lg text-[11px] font-semibold premium-gradient-soft text-primary border border-primary/20 flex items-center gap-1.5 transition-all btn-press ${loading ? 'opacity-50 pointer-events-none' : 'hover:border-primary/40 cursor-pointer'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
      <span className="relative">{loading ? 'Lendo...' : 'Identificar'}</span>
    </label>
  );
}
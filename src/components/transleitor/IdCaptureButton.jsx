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

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: SYSTEM_PROMPT,
        file_urls: [file_url],
        response_json_schema: SCHEMA,
        model: 'gemini_3_flash',
      });

      const primeiroNome = result?.data?.primeiro_nome ?? null;
      const leito = result?.data?.leito ?? null;
      const message = result?.ui_action?.message ||
        (result?.status === 'error' ? 'Não foi possível extrair os dados. Tire uma nova foto.' : 'Dados extraídos com sucesso.');

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
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        title="Capturar identificação do paciente (foto do crachá/pulseira)"
        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold premium-gradient-soft text-primary border border-primary/20 flex items-center gap-1.5 hover:border-primary/40 transition-all btn-press disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        {loading ? 'Lendo...' : 'Identificar'}
      </button>
    </>
  );
}
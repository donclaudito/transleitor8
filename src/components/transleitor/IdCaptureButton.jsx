import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

const SYSTEM_PROMPT = `Você é um módulo especialista de OCR e extração de dados clínicos para a interface do aplicativo. Sua única função é processar fotos de identificação de pacientes (crachá, pulseira de identificação, etiqueta de leito, ficha de internação ou placa de cabeceira) e retornar os dados padronizados, prontos para preencher automaticamente os campos do formulário.

CONDIÇÕES DE IMAGEM (luz variada):
- A foto pode estar com baixa luminosidade, excesso de luz (clarão), sombra, reflexo/brilho metálico, desfoque leve, rotação (até 45°) ou texto parcialmente obstruído.
- Aplique correção mental de contraste: o texto impresso costuma ser mais escuro que o fundo mesmo em fotos escuras. Considere o padrão típico de pulseiras hospitalares (nome completo em uma linha, leito/quarto abaixo) e de placas de leito (número em destaque).
- Distinga RUÍDO de TEXTO: manchas, dedos sobre a pulseira e reflexos NÃO são caracteres. Só extraia sequências que formem um nome próprio ou um código de leito coerente.

REGRAS DE EXTRAÇÃO:
- primeiro_nome: extraia APENAS o primeiro nome do paciente (o primeiro token do nome completo). Remova títulos (Dr., Sr., Sra., Srta.), abreviações e sobrenomes. Formate em Title Case. EX: "JOÃO SILVA SOBRINHO" -> "João"; "MARIA JOSÉ SANTOS" -> "Maria"; "ANA CLAUDIA" -> "Ana".
- leito: identifique e extraia o número/código do leito ou quarto. Aceite formatos como "204-B", "12A", "UTI-7", "Leito 3", "Qto 15". Remova palavras descritivas ("Leito", "Quarto", "Sala", "UTI", "Leito"), mantendo APENAS a identificação alfanumérica limpa. EX: "Leito 204-B" -> "204-B"; "Quarto 12A" -> "12A".
- Se houver múltiplas linhas com números, priorize a rotulada como "Leito"/"Quarto"/"Cama". Se não houver rótulo, use o número isolado mais provável de leito (geralmente ao lado ou abaixo do nome).
- Se um campo estiver totalmente ausente (não o nome NEM o leito estão presentes na imagem), retorne esse campo como null.
- Se a imagem estiver completamente ilegível (nenhum texto legível em luz nenhuma), retorne status "error" com mensagem pedindo nova captura com melhor iluminação. NUNCA invente dados.

GARANTIA DE PREENCHIMENTO:
- Retorne status "success" sempre que conseguir extrair AO MENOS um dos dois campos (nome ou leito), mesmo se o outro for null. O sistema preencherá o que for não-nulo automaticamente.
- Prefira extrair do que falhar: mesmo uma extração parcial (apenas o leito, ou apenas o nome) já é útil e deve ser marcada como success.

Responda ESTRITAMENTE no formato JSON abaixo, sem texto explicativo adicional, sem markdown, sem crases.`;

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
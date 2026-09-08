import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, ShieldAlert, ScanLine, CheckCircle2, ArrowRight } from 'lucide-react';

// Cards baseados nos agentes REAIS do app (base44/agents/*.jsonc) — só o que existe hoje:
// - Elvira (agente "elio"): assistente clínica, lê evoluções/pacientes do app, usa o modelo escolhido.
// - security_auditor: Red/Blue Team com evidência real, registra achados só com permissão do admin.
// - Análise de imagem médica (/imagem-medica): função analyzeMedicalImage, multimodal.
// O pipeline de imaginologia (RAG) ainda não tem página no app — fica fora até existir.
const AGENTES = [
  {
    icon: Bot,
    nome: 'Elvira',
    papel: 'Assistente clínica de plantão, 24h',
    oQueE: 'Uma colega virtual com quem você conversa por chat, em linguagem natural, dentro do app.',
    oQueFaz: 'Redige evoluções com você, interpreta exames, discute condutas e planeja tratamentos a partir do caso que você descreve — respondendo com o modelo de IA que você escolher (DeepSeek, Gemini e outros).',
    onde: '/elio',
    ondeLabel: 'Abrir no app',
    diferencial: 'Só trabalha com os dados que você fornece — não inventa exames, doses ou diagnósticos.',
  },
  {
    icon: ShieldAlert,
    nome: 'Auditor de Segurança',
    papel: 'Red Team e Blue Team do prontuário',
    oQueE: 'Um auditor interno que examina o próprio app em busca de furos, como um colega revisando o protocolo do hospital.',
    oQueFaz: 'Varre configurações, chaves de API, links e permissões de acesso aos dados clínicos. Cada achado vem com evidência real e correção sugerida — e só é registrado com sua permissão.',
    onde: '/seguranca',
    ondeLabel: 'Painel de segurança (admin)',
    diferencial: 'Nunca altera dados por conta própria e nunca cita evidência que não possa verificar.',
  },
  {
    icon: ScanLine,
    nome: 'Análise de Imagem Médica',
    papel: 'Segunda opinião em radiologia',
    oQueE: 'Envie a radiografia, tomografia, ultrassom ou ressonância e receba uma leitura sugerida na hora.',
    oQueFaz: 'Descreve os achados visíveis na imagem e lista os diagnósticos diferenciais por ordem de probabilidade — para colar no prontuário ou refinar sua própria avaliação.',
    onde: '/imagem-medica',
    ondeLabel: 'Abrir no app',
    diferencial: 'Sem inventar achados: descreve apenas o que está de fato visível na imagem enviada.',
  },
];

export default function LandingAgents() {
  return (
    <section id="agentes" className="py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">AGENTES DE IA</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Colegas de IA que trabalham com você</h2>
          <p className="text-muted-foreground">Cada assistente tem um papel definido — e todos seguem a mesma regra clínica: nada de inventar dado.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AGENTES.map((a, i) => (
            <motion.div key={a.nome}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 flex flex-col gap-4 hover:shadow-glow transition-all">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <a.icon className="w-5 h-5 text-primary" />
                </span>
                <div>
                  <h3 className="font-extrabold">{a.nome}</h3>
                  <p className="text-[11px] text-muted-foreground">{a.papel}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <p><strong className="text-foreground">O que é:</strong> <span className="text-muted-foreground">{a.oQueE}</span></p>
                <p><strong className="text-foreground">Quando atua:</strong> <span className="text-muted-foreground">{a.oQueFaz}</span></p>
              </div>
              <p className="text-xs text-primary/90 flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {a.diferencial}
              </p>
              <Link to={a.onde} className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:opacity-80 transition-all">
                {a.ondeLabel} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
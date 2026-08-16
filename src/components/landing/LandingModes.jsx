import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, FileText, Zap } from 'lucide-react';

const modes = [
  {
    icon: ClipboardList,
    badge: 'Técnico',
    title: 'SOAP',
    desc: 'Estrutura formal S — Subjetivo, O — Objetivo, A — Avaliação e P — Plano, com CID-10 sugerido.',
    accent: 'from-blue-500/20 to-blue-500/5',
    ring: 'border-blue-400/30',
  },
  {
    icon: FileText,
    badge: 'Narrativo',
    title: 'Livre',
    desc: 'Evolução completa de prontuário com HPP, medicação contínua, alergias, exames, prescrição e conduta em texto corrido.',
    accent: 'from-primary/20 to-primary/5',
    ring: 'border-primary/30',
    featured: true,
  },
  {
    icon: Zap,
    badge: 'Telegráfico',
    title: 'Simples',
    desc: 'Ultraconciso e direto ao ponto — leitura rápida para o médico que assume o plantão seguinte.',
    accent: 'from-amber-500/20 to-amber-500/5',
    ring: 'border-amber-400/30',
  },
];

export default function LandingModes() {
  return (
    <section id="modos" className="py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">Modos de Geração</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mt-3 tracking-tight">
            Escolha o formato, <br className="hidden md:block" />a IA cuida do resto
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {modes.map(({ icon: Icon, badge, title, desc, accent, ring, featured }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative rounded-2xl p-7 bg-gradient-to-br ${accent} border ${ring} ${featured ? 'md:scale-105 shadow-soft' : ''}`}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                  Padrão
                </span>
              )}
              <div className="w-12 h-12 rounded-xl bg-card/80 flex items-center justify-center mb-5 shadow-sm">
                <Icon className="w-6 h-6 text-foreground" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{badge}</span>
              <h3 className="text-2xl font-extrabold mt-1 mb-3">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
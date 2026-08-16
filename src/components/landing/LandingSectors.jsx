import React from 'react';
import { motion } from 'framer-motion';

const sectors = [
  { emoji: '🏥', name: 'UTI Adulto', desc: 'Foco cirúrgico pós-op: ferida, anastomoses, drenos, red flags de complicação técnica.' },
  { emoji: '🚑', name: 'Pronto Socorro', desc: 'Triagem rápida, ressuscitação e decisão de reabordagem imediata com olhar cirúrgico.' },
  { emoji: '⚡', name: 'Emergência / Fast-Track', desc: 'Cirurgião filtro: 5 Ws por DPO, exame bedside e matriz de decisão Alta→CC.' },
  { emoji: '🔪', name: 'Cirurgia', desc: 'Evolução diária pós-operatória formal com PO, subjetivo, objetivo e plano.' },
  { emoji: '🪑', name: 'Consultório', desc: 'Gastroenterologia e Coloproctologia: queixas digestivas, rastreio e condutas ambulatoriais.' },
  { emoji: '🛏️', name: 'Enfermaria', desc: 'Evolução longitudinal e planejamento de alta com foco na continuidade do cuidado.' },
];

export default function LandingSectors() {
  return (
    <section id="setores" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">IA Setorial</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mt-3 tracking-tight">
            A IA muda conforme <br className="hidden md:block" />o setor do paciente
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Cada setor tem um raciocínio clínico próprio. O Transleitor adapta o tom, a estrutura e os alertas automaticamente.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map(({ emoji, name, desc }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
              className="glass-card rounded-2xl p-5 hover:shadow-soft transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">{emoji}</span>
                <h3 className="font-bold">{name}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardEdit, BrainCircuit, FileCheck2 } from 'lucide-react';

const steps = [
  { n: '01', icon: ClipboardEdit, title: 'Preencha o contexto clínico', desc: 'Setor, identificação, comorbidades, evoluções anteriores, enfermagem, exames e prescrição — cole tudo livremente.' },
  { n: '02', icon: BrainCircuit, title: 'A IA processa e correlaciona', desc: 'Raciocínio setorial + análise cronológica das evoluções e exames, integrando prescrição e comorbidades.' },
  { n: '03', icon: FileCheck2, title: 'Copie a evolução pronta', desc: 'Receba a evolução no formato escolhido (SOAP, Livre ou Simples) em terminologia médica formal, pronta para o prontuário.' },
];

export default function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="py-24 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">Como Funciona</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mt-3 tracking-tight">Três passos. Pronto.</h2>
        </div>
        <div className="space-y-5">
          {steps.map(({ n, icon: Icon, title, desc }, i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex gap-5 items-start glass-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-extrabold text-primary/40">{n}</span>
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
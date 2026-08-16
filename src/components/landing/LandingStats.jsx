import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { value: '3', label: 'Modos de evolução', sub: 'SOAP, Livre e Simples' },
  { value: '6+', label: 'Setores inteligentes', sub: 'raciocínio adaptativo' },
  { value: '∞', label: 'Evoluções anteriores', sub: 'análise cronológica' },
  { value: '100%', label: 'Prontuário', sub: 'terminologia médica formal' },
];

export default function LandingStats() {
  return (
    <section className="py-20 px-6 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-[90px]" />
      </div>
      <div className="relative max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map(({ value, label, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <div className="text-4xl md:text-6xl font-extrabold">{value}</div>
            <div className="text-sm font-bold mt-2">{label}</div>
            <div className="text-xs text-primary-foreground/60 mt-1">{sub}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
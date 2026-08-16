import React from 'react';
import { Layers, BrainCircuit, TrendingUp, Pill, FileSearch, Repeat, PanelTop, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Layers, title: 'Três modos de evolução', desc: 'SOAP estruturado, Livre narrativo ou Simples ultracônciso — escolha o formato ideal para cada momento do plantão.' },
  { icon: BrainCircuit, title: 'IA setorial adaptativa', desc: 'Contexto clínico específico para UTI, Pronto Socorro, Emergência, Cirurgia, Consultório e Enfermaria.' },
  { icon: TrendingUp, title: 'Análise cronológica', desc: 'A IA reconstrói a linha do tempo do paciente a partir das evoluções anteriores e identifica tendências laboratoriais dia a dia.' },
  { icon: Pill, title: 'Comorbidades & Alergias', desc: 'Chips inteligentes com medicações crônicas associadas e alertas de alergia integrados ao raciocínio clínico.' },
  { icon: FileSearch, title: 'Interpretação de Exames', desc: 'Extração automática de laudos laboratoriais em PDF com análise estruturada e comparativa dos valores.' },
  { icon: Repeat, title: 'Passagem de Visita', desc: 'Geração de handover ultracurto para o plantonista seguinte, com rastreamento nativo do status do paciente.' },
  { icon: PanelTop, title: 'Painéis de especialidade', desc: 'Atalhos contextuais: sintomas, gastro, cirurgia, UTI, PS e emergência com condutas guiadas à beira-leito.' },
  { icon: Cpu, title: 'Multi-modelo de IA', desc: 'Alterne entre provedores (Gemini, Magistral e mais) diretamente do cabeçalho, conforme a complexidade do caso.' },
];

export default function LandingFeatures() {
  return (
    <section id="funcionalidades" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">Funcionalidades</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mt-3 tracking-tight">
            Tudo o plantão precisa, <br className="hidden md:block" />num só fluxo
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Do dado bruto à evolução de prontuário — uma plataforma desenhada para a realidade clínica brasileira.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
              className="glass-card rounded-2xl p-6 hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
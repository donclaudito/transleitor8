import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Sparkles, Shield, Clock, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 px-6">
      {/* Ambient gradient mesh */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-accent-foreground/10 rounded-full blur-[100px] opacity-50" />
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[100px] opacity-40" />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-7 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" /> Plataforma Clínica com IA Adaptativa
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Documentação clínica
            <br />
            <span className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">inteligente e completa</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Gere evoluções SOAP, Livres e Simples em segundos. IA que entende o setor, analisa evoluções anteriores
            cronologicamente e integra exames, prescrição e comorbidades num só fluxo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/transleitor" className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg btn-press">
              Começar Agora <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#como-funciona" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-border rounded-2xl text-sm font-bold text-foreground hover:border-primary hover:text-primary transition-colors">
              <Play className="w-4 h-4" /> Ver Como Funciona
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-14 text-muted-foreground text-xs font-medium"
        >
          {[
            { icon: Shield, text: 'Dados seguros' },
            { icon: Clock, text: 'Evolução em segundos' },
            { icon: Activity, text: 'Análise cronológica' },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-primary" /> {text}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
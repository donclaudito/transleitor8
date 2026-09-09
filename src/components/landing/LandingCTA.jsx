import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingCTA() {
  return (
    <>
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-12 shadow-soft"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Comece a usar <span className="text-primary">agora mesmo</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Gere sua primeira evolução clínica em menos de dois minutos — escolha o modo, o setor e cole os dados.
          </p>
          <Link
            to="/menu"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg btn-press"
          >
            Acessar Transleitor <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </section>

      <footer className="py-8 px-6 border-t border-border text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Transleitor — IA Clínica Adaptativa · Documentação médica inteligente
      </footer>
    </>
  );
}
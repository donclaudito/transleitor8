import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Heart, FileText, FlaskConical, Stethoscope, Zap, Menu, X, ArrowRight, Shield, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const ACCENT = '#7c6bc4';

const features = [
  { icon: User, title: 'Identificação do Paciente', desc: 'Registre iniciais, leito e setor com agilidade. O contexto orienta toda a IA.' },
  { icon: Heart, title: 'Comorbidades', desc: 'Adicione comorbidades com chips inteligentes e deixe a IA considerar cada detalhe.' },
  { icon: FileText, title: 'Descrição Clínica', desc: 'Digite dados brutos livremente — a IA interpreta e estrutura em linguagem médica formal.' },
  { icon: FlaskConical, title: 'Exames Complementares', desc: 'Informe resultados laboratoriais integrados ao raciocínio clínico.' },
  { icon: Stethoscope, title: 'Evolução SOAP', desc: 'Geração automática de S, O, A e P com terminologia técnica pronta para prontuário.' },
  { icon: Zap, title: 'Atalhos Clínicos', desc: 'Biblioteca de frases e rotinas para inserção rápida — favoritos, busca e categorias.' },
];

const steps = [
  { n: '01', title: 'Preencha os dados do paciente', desc: 'Informe setor, leito, comorbidades, exames e descreva o quadro clínico livremente.' },
  { n: '02', title: 'A IA processa e adapta', desc: 'O TRANSLEITOR analisa o contexto do setor e aplica o raciocínio clínico correspondente.' },
  { n: '03', title: 'Copie a evolução pronta', desc: 'Receba uma evolução SOAP completa, em terminologia médica formal, pronta para o prontuário.' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1a1a1a]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#faf8f5]/80 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold tracking-tight">
            Transleitor<span className="text-[#7c6bc4]">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {['Funcionalidades', 'Como Funciona', 'Contato'].map(label => (
              <a key={label} href={`#${label.toLowerCase().replace(' ', '-')}`} className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors font-medium">
                {label}
              </a>
            ))}
            <Link to="/transleitor" className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-bold hover:bg-[#7c6bc4] transition-colors">
              Acessar App
            </Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden px-6 pb-4 space-y-3">
            {['Funcionalidades', 'Como Funciona'].map(label => (
              <a key={label} href={`#${label.toLowerCase().replace(' ', '-')}`} className="block text-sm text-[#666]" onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <Link to="/transleitor" className="block px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-bold text-center" onClick={() => setMenuOpen(false)}>
              Acessar App
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f3f0ff] via-[#faf8f5] to-[#fff5ee] opacity-60" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7c6bc4]/10 text-[#7c6bc4] text-xs font-bold mb-6">
              <Stethoscope className="w-3.5 h-3.5" /> Plataforma Médica com IA
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
              IA Clínica{' '}
              <span className="bg-gradient-to-r from-[#7c6bc4] to-[#5a4fa0] bg-clip-text text-transparent">Adaptativa</span>
            </h1>
            <p className="text-lg md:text-xl text-[#666] max-w-2xl mx-auto mb-10 leading-relaxed">
              Evolução SOAP inteligente, rápida e precisa. Transforme dados clínicos brutos em documentação médica profissional em segundos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/transleitor" className="px-8 py-4 bg-[#1a1a1a] text-white rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-[#7c6bc4] transition-colors shadow-lg">
                Começar Agora <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#como-funciona" className="px-8 py-4 border-2 border-[#e5e5e5] rounded-2xl text-sm font-bold text-[#666] hover:border-[#7c6bc4] hover:text-[#7c6bc4] transition-colors">
                Ver Demo
              </a>
            </div>
          </motion.div>
          <div className="flex items-center justify-center gap-8 mt-12 text-[#999] text-xs font-medium">
            {[{ icon: Shield, text: 'Dados seguros' }, { icon: Zap, text: 'IA em tempo real' }, { icon: Star, text: '+500 relatórios/mês' }].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" /> {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-[#7c6bc4] tracking-widest uppercase">Funcionalidades</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 tracking-tight">
              Tudo que você precisa, <br className="hidden md:block" />em um só fluxo
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} whileHover={{ y: -4 }} className="p-6 rounded-2xl bg-[#faf8f5] hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#7c6bc4]/10">
                <div className="w-11 h-11 rounded-xl bg-[#7c6bc4]/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#7c6bc4]" />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24 px-6 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-[#7c6bc4] tracking-widest uppercase">Como Funciona</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 tracking-tight">
              Três passos para a <br className="hidden md:block" />evolução perfeita
            </h2>
          </div>
          <div className="space-y-8">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] text-white flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                  {n}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{title}</h3>
                  <p className="text-[#666] text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-[#1a1a1a] text-white">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '10×', label: 'Mais Rápido', sub: 'do que digitar manualmente' },
            { value: '100%', label: 'Clínico', sub: 'terminologia médica formal' },
            { value: 'IA', label: 'Adaptativa', sub: 'ajusta ao setor hospitalar' },
          ].map(({ value, label, sub }) => (
            <div key={label}>
              <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-[#7c6bc4] to-[#a89ed4] bg-clip-text text-transparent">{value}</div>
              <div className="text-sm font-bold mt-2">{label}</div>
              <div className="text-xs text-white/50 mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#faf8f5]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Comece a usar <span className="text-[#7c6bc4]">agora mesmo</span>
          </h2>
          <p className="text-[#666] mb-8">Acesse a plataforma e gere sua primeira evolução SOAP em menos de dois minutos.</p>
          <Link to="/transleitor" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a1a1a] text-white rounded-2xl text-sm font-bold hover:bg-[#7c6bc4] transition-colors shadow-lg">
            Acessar Transleitor <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-black/5 text-center text-xs text-[#999]">
        © {new Date().getFullYear()} Transleitor — IA Clínica Adaptativa
      </footer>
    </div>
  );
}
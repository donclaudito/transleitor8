import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Stethoscope, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: authed } = useQuery({
    queryKey: ['is-authenticated'],
    queryFn: () => base44.auth.isAuthenticated(),
    staleTime: 60000,
  });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Modos', href: '#modos' },
    { label: 'Setores', href: '#setores' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Agentes', href: '#agentes' },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-soft' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-primary-foreground" />
          </span>
          Transleitor<span className="text-primary">.</span>
        </Link>
        <div className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <a key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              {l.label}
            </a>
          ))}
          {authed && (
            <Link to="/capturas" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/30 text-sm font-bold hover:bg-primary/20 transition-all">
              📄 Capturar laudo/exame
            </Link>
          )}
          <Link to="/transleitor" className="group inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg btn-press">
            Acessar App <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 space-y-1 glass border-t border-border">
          {links.map(l => (
            <a key={l.label} href={l.href} className="block py-2.5 text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          {authed && (
            <Link to="/capturas" className="block px-5 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/30 text-sm font-bold text-center" onClick={() => setMenuOpen(false)}>
              📄 Capturar laudo/exame
            </Link>
          )}
          <Link to="/transleitor" className="block px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold text-center" onClick={() => setMenuOpen(false)}>
            Acessar App
          </Link>
        </div>
      )}
    </nav>
  );
}
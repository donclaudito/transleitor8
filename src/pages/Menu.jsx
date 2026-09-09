import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Hospital } from 'lucide-react';

const CARDS = [
  {
    id: 'hospital',
    to: '/especialidades?ambiente=hospital',
    Icone: Hospital,
    titulo: 'Ambiente Hospitalar',
    desc: 'Setores, leitos e evolução hospitalar',
  },
  {
    id: 'clinica',
    to: '/especialidades?ambiente=clinica',
    Icone: Building2,
    titulo: 'Clínicas & Ambulatório',
    desc: 'Consultas e atendimentos ambulatoriais',
  },
];

export default function Menu() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-8 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Escolha o ambiente</h1>
        <p className="text-sm text-muted-foreground">Onde você vai atender agora?</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
        {CARDS.map(({ id, to, Icone, titulo, desc }) => (
          <Link
            key={id}
            to={to}
            className="premium-card rounded-2xl p-8 flex flex-col items-center gap-4 text-center hover:border-primary/40 transition-all btn-press"
          >
            <span className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Icone className="w-7 h-7" />
            </span>
            <span className="space-y-1">
              <span className="block text-lg font-extrabold">{titulo}</span>
              <span className="block text-xs text-muted-foreground">{desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
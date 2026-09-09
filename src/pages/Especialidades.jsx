import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AMBIENTES, ESPECIALIDADES } from '@/lib/clinicas';
import { getEspecialidade } from '@/lib/especialidades';

export default function Especialidades() {
  const [searchParams] = useSearchParams();
  const ambiente = searchParams.get('ambiente') === 'clinica' ? 'clinica' : 'hospital';
  const amb = AMBIENTES[ambiente];

  // Cada especialidade abre o SEU transleitor; exceção: Cirurgia de origem hospitalar
  // segue no fluxo geral (a versão ambulatorial tem variante própria).
  const destinoDa = (e) => {
    if (e.slug === 'cirurgia') {
      return ambiente === 'hospital'
        ? '/transleitor?ambiente=hospital&especialidade=cirurgia'
        : '/cirurgia-ambulatorial?ambiente=clinica&especialidade=cirurgia-ambulatorial';
    }
    const esp = getEspecialidade(e.slug);
    return esp
      ? `${esp.rota}?ambiente=${ambiente}&especialidade=${e.slug}`
      : `/transleitor?ambiente=${ambiente}&especialidade=${e.slug}`;
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/menu"
            title="Voltar ao menu"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold">
            {amb.icone} Especialidades ({amb.rotulo})
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {ESPECIALIDADES.map(e => {
            const Icone = e.icone;
            return (
              <Link
                key={e.id}
                to={destinoDa(e)}
                className="premium-card rounded-2xl p-5 flex flex-col items-center gap-3 text-center hover:border-primary/40 transition-all btn-press"
              >
                <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icone className="w-5 h-5" />
                </span>
                <span className="text-sm font-bold leading-tight">{e.nome}</span>
              </Link>
            );
          })}
        </div>

        {ambiente === 'hospital' && (
          <Link
            to="/transleitor"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Abrir Transleitor geral <ExternalLink className="w-3 h-3" />
          </Link>
        )}

        <p className="text-xs text-muted-foreground">
          Cada especialidade abre o seu próprio Transleitor, com o raciocínio da área.
        </p>
      </div>
    </div>
  );
}
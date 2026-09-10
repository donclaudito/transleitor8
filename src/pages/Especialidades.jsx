import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { AMBIENTES, ESPECIALIDADES } from '@/lib/clinicas';
import { getEspecialidade } from '@/lib/especialidades';

export default function Especialidades() {
  const [searchParams] = useSearchParams();
  const ambiente = searchParams.get('ambiente') === 'clinica' ? 'clinica' : 'hospital';
  const amb = AMBIENTES[ambiente];
  const { user } = useAuth();

  // Personalizações do médico logado: padrões ocultadas + especialidades criadas por ele.
  const { data: minhas = [] } = useQuery({
    queryKey: ['minhas-especialidades', user?.id],
    queryFn: () => base44.entities.MinhaEspecialidade.filter({ created_by_id: user.id }),
    enabled: !!user,
  });

  const ocultas = new Set(minhas.filter(m => m.ativa === false).map(m => m.slug));
  const doMedico = new Set(minhas.map(m => m.slug));
  const criadas = minhas
    .filter(m => m.criada === true && m.ativa !== false)
    .filter(m => m.ambiente === 'ambos' || m.ambiente === ambiente);

  // Grade = padrões não ocultadas (nem substituídas por registro próprio) + criadas do
  // médico, cada uma respeitando o ambiente da tela (hospital ou clínicas).
  const items = [
    ...ESPECIALIDADES.filter(e => !ocultas.has(e.slug) && !doMedico.has(e.slug)),
    ...criadas.map(m => ({ id: `minha-${m.id}`, nome: m.nome, slug: m.slug, minha: true })),
  ];

  // Cada especialidade abre o SEU transleitor; exceção: Cirurgia de origem hospitalar
  // segue no fluxo geral (a versão ambulatorial tem variante própria). Criadas pelo
  // médico abrem a rota parametrizada (ou a padrão, se tiver variante própria).
  const destinoDa = (e) => {
    if (e.minha) {
      const padrao = getEspecialidade(e.slug);
      return padrao
        ? `${padrao.rota}?ambiente=${ambiente}&especialidade=${e.slug}`
        : `/especialidade/${e.slug}?ambiente=${ambiente}&especialidade=${e.slug}`;
    }
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
          {items.map(e => {
            const Icone = e.icone;
            return (
              <Link
                key={e.id}
                to={destinoDa(e)}
                className="premium-card rounded-2xl p-5 flex flex-col items-center gap-3 text-center hover:border-primary/40 transition-all btn-press"
              >
                <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {e.minha ? <span className="text-xl leading-none">🏷️</span> : <Icone className="w-5 h-5" />}
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
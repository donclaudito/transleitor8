import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import Transleitor from './Transleitor';
import { configDeMinhaEspecialidade } from '@/lib/especialidades';

// Rota parametrizada das especialidades CRIADAS pelo médico (/especialidade/:slug):
// carrega o registro dele com aquele slug e monta a config da área (persona pelo nome,
// com todas as regras transversais do app). Slug que não é dele volta ao menu.
export default function TransleitorMinhaEspecialidade() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['minhas-especialidades', user?.id],
    queryFn: () => base44.entities.MinhaEspecialidade.filter({ created_by_id: user.id }),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const reg = registros.find(r => r.slug === slug && r.criada === true && r.ativa !== false);
  if (!reg) return <Navigate to="/especialidades" replace />;
  return <Transleitor variante={reg.slug} config={configDeMinhaEspecialidade(reg)} />;
}
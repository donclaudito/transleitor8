import React from 'react';
import { Navigate } from 'react-router-dom';
import Transleitor from './Transleitor';
import { getEspecialidade } from '@/lib/especialidades';

// Página única parametrizada das variantes do Transleitor: cada rota de especialidade
// (ex.: /cardiologia, /urologia) renderiza o Transleitor REAL com a variante da área —
// mesmo formulário/fluxo, mudando apenas o cabeçalho identificador e o foco de
// especialidade (persona) usado na geração. Slugs inválidos voltam ao menu de especialidades.
export default function TransleitorEspecialidade({ slug }) {
  const esp = getEspecialidade(slug);
  if (!esp) return <Navigate to="/especialidades" replace />;
  return <Transleitor variante={slug} />;
}
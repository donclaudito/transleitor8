import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

// Cabeçalho de confirmação da variante do Transleitor (ex.: Clínica Médica).
// Breadcrumb Menu › Ambiente › Especialidade + botão Voltar, visível no desktop e no celular.
export default function VarianteHeader({ icone, titulo, subtitulo, ambienteSlug, ambienteRotulo, especialidadeRotulo }) {
  return (
    <div className="glass px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border flex items-center gap-3">
      <Link
        to="/menu"
        title="Voltar ao menu"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/40 text-primary text-xs font-bold hover:bg-accent transition-all flex-shrink-0"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Voltar</span>
      </Link>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
          <Link to="/menu" className="hover:text-foreground transition-colors">Menu</Link>
          <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" />
          <Link to={`/especialidades?ambiente=${ambienteSlug}`} className="hover:text-foreground transition-colors">{ambienteRotulo}</Link>
          <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{especialidadeRotulo}</span>
        </p>
        <h2 className="text-sm sm:text-base font-extrabold truncate">{icone} {titulo}</h2>
        <p className="text-[10px] text-muted-foreground truncate">{subtitulo}</p>
      </div>
    </div>
  );
}
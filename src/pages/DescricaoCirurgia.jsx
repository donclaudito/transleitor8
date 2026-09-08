import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Pencil } from 'lucide-react';
import DescricaoCirurgicaEditor from '@/components/transleitor/DescricaoCirurgicaEditor';
import { useSettings } from '@/hooks/useSettings';

export default function DescricaoCirurgia() {
  const { settings, setTheme } = useSettings();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="glass px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 border-b border-border flex-shrink-0">
        <Link to="/transleitor" title="Voltar ao Transleitor"
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <Pencil className="w-4 h-4 text-primary flex-shrink-0" />
          <h1 className="text-base font-extrabold tracking-tight whitespace-nowrap truncate">Descrição da Cirurgia</h1>
        </div>
        <button
          onClick={() => setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
          title={settings.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          className="ml-auto p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all flex-shrink-0"
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>
      <DescricaoCirurgicaEditor />
    </div>
  );
}
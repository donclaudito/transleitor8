import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, History, Plus, Settings, Calculator, Wrench, Sun, Moon, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Header({ view, setView, theme, setTheme, onNewEvolution }) {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });
  const isAdmin = user?.role === 'admin';

  const navButtons = [
    { id: 'history', icon: History, label: 'Histórico' },
    { id: 'scores', icon: Calculator, label: 'Escores' },
    { id: 'tools', icon: Wrench, label: 'Ferramentas' },
    { id: 'new', icon: Plus, label: 'Nova', action: onNewEvolution },
    { id: 'settings', icon: Settings, label: 'Config' },
  ];

  return (
    <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-4">
      <Link to="/" className="flex items-center gap-2 mr-auto">
        <Stethoscope className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-extrabold tracking-tight">Transleitor<span className="text-primary opacity-60 text-xs ml-1">7</span></h1>
      </Link>

      <nav className="flex items-center gap-1">
        {navButtons.map(({ id, icon: Icon, label, action }) => {
          const isActive = id !== 'new' && view === id;
          return (
            <button
              key={id}
              onClick={() => action ? action() : setView(id)}
              title={label}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {isAdmin && (
        <Link to="/gerenciar-apps" className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all" title="Gerenciar Apps">
          <BookOpen className="w-4 h-4" />
        </Link>
      )}
    </header>
  );
}
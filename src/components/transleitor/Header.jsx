import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, History, Plus, Settings, Calculator, Wrench, Sun, Moon, BookOpen, ChevronDown, ExternalLink, Microscope, Cpu, Bot } from 'lucide-react';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Header({ view, setView, theme, setTheme, onNewEvolution, activeLLMName, llmProviders = [], selectedLLMId = '', setSelectedLLMId = () => {} }) {
  const [appsOpen, setAppsOpen] = useState(false);
  const [llmOpen, setLlmOpen] = useState(false);
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });
  const { data: appLinks = [] } = useQuery({
    queryKey: ['applinks-header'],
    queryFn: () => base44.entities?.AppLink ? base44.entities.AppLink.filter({ ativo: true }, 'ordem', 50) : Promise.resolve([]),
  });
  const isAdmin = user?.role === 'admin';
  const activeApps = appLinks.filter(l => l.ativo !== false);

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

      {/* Seletor de LLM no cabeçalho */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setLlmOpen(!llmOpen)}
          title="Trocar modelo de IA"
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 hover:bg-primary/20 transition-all cursor-pointer"
        >
          <Cpu className="w-3 h-3" /> {activeLLMName || 'Gemini Flash'}
        </button>
        {llmOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setLlmOpen(false)} />
            <div className="absolute left-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-2xl overflow-hidden z-40">
              <div className="py-1">
                <button
                  onClick={() => { setSelectedLLMId(''); setLlmOpen(false); }}
                  className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-accent transition-colors ${!selectedLLMId ? 'bg-primary/10 text-primary font-bold' : ''}`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span className="flex-1 truncate">Gemini Flash</span>
                  {!selectedLLMId && <span className="text-[10px] text-green-500 font-bold">✓</span>}
                </button>
                {llmProviders.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedLLMId(p.id); setLlmOpen(false); }}
                    className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-accent transition-colors ${selectedLLMId === p.id ? 'bg-primary/10 text-primary font-bold' : ''}`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span className="flex-1 truncate">{p.provider_name} — {p.model_name}</span>
                    {selectedLLMId === p.id && <span className="text-[10px] text-green-500 font-bold">✓</span>}
                  </button>
                ))}
                {llmProviders.length === 0 && (
                  <p className="px-4 py-2.5 text-xs text-muted-foreground">Nenhum provedor cadastrado</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Link to="/chamsa" title="Chamsa Isa — Assistente Cirúrgica" className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500/15 to-violet-500/15 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold hover:from-teal-500/25 hover:to-violet-500/25 transition-all">
        <Bot className="w-3.5 h-3.5" /> Chamsa
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

      <Link to="/exames" title="Interpretação de Exames"
        className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
        <Microscope className="w-4 h-4" />
      </Link>

      {isAdmin && (
        <Link to="/admin-llms" title="Provedores de IA"
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <Cpu className="w-4 h-4" />
        </Link>
      )}

      {/* Apps dropdown */}
      <div className="relative">
        <button
          onClick={() => setAppsOpen(!appsOpen)}
          title="Apps"
          className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-1 ${
            appsOpen ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <ChevronDown className={`w-3 h-3 transition-transform ${appsOpen ? 'rotate-180' : ''}`} />
        </button>
        {appsOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setAppsOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-2xl overflow-hidden z-40">
              {activeApps.length > 0 && (
                <div className="py-1">
                  {activeApps.map(app => (
                    <a
                      key={app.id}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setAppsOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    >
                      <span className="text-base">{app.icone || '🔗'}</span>
                      <span className="flex-1 truncate font-medium">{app.nome}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-50" />
                    </a>
                  ))}
                </div>
              )}
              {isAdmin && (
                <>
                  <Link
                    to="/gerenciar-apps"
                    onClick={() => setAppsOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-accent transition-colors ${activeApps.length > 0 ? 'border-t border-border' : ''}`}
                  >
                    <span>⚙️</span>
                    Gerenciar Apps
                  </Link>
                  <Link
                    to="/admin-llms"
                    onClick={() => setAppsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-accent transition-colors"
                  >
                    <Cpu className="w-4 h-4" /> Provedores de IA
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
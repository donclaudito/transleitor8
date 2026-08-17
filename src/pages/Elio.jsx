import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Stethoscope, Menu, X } from 'lucide-react';
import ElioChat from '@/components/elio/ElioChat';
import ElioSidebar from '@/components/elio/ElioSidebar';

export default function Elio() {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNew = () => {
    setActiveConversationId(null);
    setMobileOpen(false);
  };

  const handleSelect = (id) => {
    setActiveConversationId(id);
    setMobileOpen(false);
  };

  const handleCreated = (id) => setActiveConversationId(id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/transleitor" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-extrabold leading-tight">Elvio</h1>
          <p className="text-[11px] text-muted-foreground -mt-0.5">Copiloto clínico</p>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex w-72 flex-shrink-0 border-r border-border glass flex-col">
          <ElioSidebar activeConversationId={activeConversationId} onNew={handleNew} onSelect={handleSelect} />
        </aside>

        {/* Sidebar mobile (overlay) */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-72 max-w-[80%] bg-card border-r border-border flex flex-col shadow-2xl">
              <button onClick={() => setMobileOpen(false)} className="absolute top-2 right-2 z-10 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
              <ElioSidebar activeConversationId={activeConversationId} onNew={handleNew} onSelect={handleSelect} />
            </aside>
          </div>
        )}

        {/* Chat */}
        <main className="flex-1 flex flex-col min-w-0">
          <ElioChat conversationId={activeConversationId} onConversationCreated={handleCreated} />
        </main>
      </div>
    </div>
  );
}
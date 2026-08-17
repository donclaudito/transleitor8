import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import ElioChat from '@/components/elio/ElioChat';

export default function Elio() {
  const [activeConversationId, setActiveConversationId] = useState(null);

  const handleCreated = (id) => setActiveConversationId(id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <Link to="/transleitor" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-extrabold leading-tight">Elvio</h1>
          <p className="text-[11px] text-muted-foreground -mt-0.5">Assistente clínico</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-w-0">
        <ElioChat conversationId={activeConversationId} onConversationCreated={handleCreated} />
      </main>
    </div>
  );
}
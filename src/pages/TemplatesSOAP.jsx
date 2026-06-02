import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, FileText, Tag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function TemplateModal({ template, onClose }) {
  if (!template) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg glass-card rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-lg">{template.name}</h2>
            <p className="text-xs text-muted-foreground">{template.specialty}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Esqueleto do Plano</h3>
          <pre className="text-sm whitespace-pre-wrap bg-muted rounded-xl p-4 border border-border">{template.skeleton}</pre>
        </div>
      </motion.div>
    </div>
  );
}

export default function TemplatesSOAP() {
  const [search, setSearch] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const [selected, setSelected] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['plantemplates'],
    queryFn: () => base44.entities.PlanTemplate.list('-created_date', 100),
  });

  const specialties = [...new Set(templates.map(t => t.specialty).filter(Boolean))].sort();

  const filtered = templates.filter(t => {
    const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.specialty?.toLowerCase().includes(search.toLowerCase());
    const matchSpec = !filterSpec || t.specialty === filterSpec;
    return matchSearch && matchSpec;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-6 py-4 flex items-center gap-4">
        <Link to="/transleitor" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-extrabold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Templates SOAP</h1>
          <p className="text-xs text-muted-foreground">{templates.length} template(s) cadastrado(s)</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar templates..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterSpec('')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${!filterSpec ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/30'}`}>
            Todas
          </button>
          {specialties.map(spec => (
            <button key={spec} onClick={() => setFilterSpec(spec === filterSpec ? '' : spec)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${filterSpec === spec ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/30'}`}>
              {spec}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Carregando templates...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhum template encontrado</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <motion.div key={t.id} whileHover={{ y: -2 }} onClick={() => setSelected(t)}
                className="cursor-pointer glass-card rounded-2xl p-5 space-y-3 hover:border-primary/20 transition-all">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm">{t.name}</h3>
                  {t.is_default && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Padrão</span>}
                </div>
                <p className="text-xs text-muted-foreground">{t.specialty}</p>
                <p className="text-xs text-muted-foreground/70 line-clamp-3">{t.skeleton?.slice(0, 120)}...</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <TemplateModal template={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
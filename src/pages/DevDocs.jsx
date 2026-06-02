import React from 'react';
import { ArrowLeft, BookOpen, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const schemas = [
  { name: 'Evolution', desc: 'Histórico de evoluções SOAP geradas pela IA.', fields: ['sector: string', 'bed: string', 'patient_initials: string', 'comorbidities: text', 'labs: text', 'clinical_description: text (required)', 'soap_text: text (required)'] },
  { name: 'Patient', desc: 'Cadastro de pacientes.', fields: ['name: string (required)'] },
  { name: 'Appointment', desc: 'Consultas clínicas.', fields: ['patient_id: string', 'patient_name: string', 'type: enum', 'chief_complaint: text', 'evolution: text', 'conduct_change: text', 'exam_results: text', 'prescription: text', 'notes: text'] },
  { name: 'PlanTemplate', desc: 'Templates customizados para o Plano.', fields: ['name: string', 'specialty: string', 'skeleton: text'] },
  { name: 'AppLink', desc: 'Links de apps externos.', fields: ['nome: string', 'url: string', 'icone: string', 'categoria: string', 'ativo: boolean', 'ordem: number'] },
];

export default function DevDocs() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-6 py-4 flex items-center gap-4">
        <Link to="/transleitor" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-extrabold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Developer Documentation</h1>
          <p className="text-xs text-muted-foreground">Admin Schema Reference</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h2 className="font-bold flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> Database Schema Reference</h2>
          <div className="grid gap-4">
            {schemas.map(s => (
              <div key={s.name} className="rounded-xl border border-border p-4 space-y-2">
                <h3 className="font-bold text-primary">{s.name}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {s.fields.map(f => <li key={f} className="font-mono">• {f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
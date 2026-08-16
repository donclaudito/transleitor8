import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, Save, Trash2, BedDouble, ClipboardCheck, CheckCircle2,
  Home, Truck, ArrowRightLeft, User, MapPin, Loader2
} from 'lucide-react';

const SETORES = [
  'Emergência (Sala Vermelha)', 'Emergência (Sala Amarela)', 'Emergência (Sala Verde)',
  'UTI Adulto', 'UTI Pediátrica', 'Enfermaria Clínica', 'Enfermaria Cirúrgica',
  'Pronto Socorro', 'Consultório', 'Centro Cirúrgico', 'Sala de Recuperação Pós-Anestésica'
];

const STATUS_OPTIONS = [
  { id: 'Internado', icon: BedDouble, color: 'blue' },
  { id: 'Avaliação', icon: ClipboardCheck, color: 'amber' },
  { id: 'Alta Hospitalar', icon: Home, color: 'emerald' },
  { id: 'Alta da UTI', icon: CheckCircle2, color: 'teal' },
  { id: 'Transferido', icon: Truck, color: 'purple' },
  { id: 'Retorno UPA', icon: ArrowRightLeft, color: 'rose' },
];

const STATUS_STYLES = {
  Internado: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'Avaliação': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'Alta Hospitalar': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'Alta da UTI': 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
  Transferido: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'Retorno UPA': 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
};

const EMPTY_FORM = { setor: '', leito: '', paciente: '', diagnostico: '', status: '' };

export default function Passagem() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['registros-passagem'],
    queryFn: () => base44.entities.RegistroPassagem.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RegistroPassagem.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['registros-passagem'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RegistroPassagem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['registros-passagem'] }),
  });

  const canSave = form.paciente.trim() && form.status;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        setor: form.setor || null,
        leito: form.leito.trim() || null,
        paciente: form.paciente.trim(),
        diagnostico: form.diagnostico.trim() || null,
        status: form.status,
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      alert('Erro ao salvar registro: ' + (err?.message || 'erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  // Agrupa por setor para a listagem
  const grouped = registros.reduce((acc, r) => {
    const key = r.setor || 'Sem setor';
    (acc[key] = acc[key] || []).push(r);
    return acc;
  }, {});
  const setorKeys = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <Link to="/transleitor" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-extrabold tracking-tight">Passagem de Visita</h1>
        <span className="ml-auto text-xs text-muted-foreground">{registros.length} registros</span>
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* Formulário Novo Registro */}
        <div className="glass-card rounded-2xl p-5 space-y-5">
          <h2 className="text-base font-bold">Novo Registro</h2>

          {/* Setor */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Setor / Localização</label>
            <select
              value={form.setor}
              onChange={e => setForm({ ...form, setor: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all"
            >
              <option value="">Selecione o setor...</option>
              {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Leito + Paciente */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Leito</label>
              <input
                placeholder="Ex: Leito 04"
                value={form.leito}
                onChange={e => setForm({ ...form, leito: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paciente</label>
              <input
                placeholder="Nome do paciente"
                value={form.paciente}
                onChange={e => setForm({ ...form, paciente: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Diagnóstico */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Diagnóstico / Condutas / Pendências</label>
            <textarea
              rows={4}
              placeholder="Descreva o quadro, medicações pendentes, exames..."
              value={form.diagnostico}
              onChange={e => setForm({ ...form, diagnostico: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status do Paciente</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUS_OPTIONS.map(({ id, icon: Icon }) => {
                const selected = form.status === id;
                return (
                  <button
                    key={id}
                    onClick={() => setForm({ ...form, status: id })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      selected
                        ? 'bg-primary/15 border-primary/40 text-primary shadow-sm'
                        : 'border-border text-muted-foreground hover:border-primary/20 hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg btn-press"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar Registro'}
          </button>
        </div>

        {/* Listagem */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registros Salvos</h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : registros.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
              <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Nenhum registro salvo</p>
              <p className="text-xs mt-1">Preencha o formulário acima para registrar uma passagem.</p>
            </div>
          ) : (
            setorKeys.map(setor => (
              <div key={setor} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{setor}</span>
                  <span className="text-[10px] text-muted-foreground">({grouped[setor].length})</span>
                </div>
                {grouped[setor].map(r => (
                  <div key={r.id} className="glass-card rounded-2xl p-4 group transition-all hover:border-primary/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {r.paciente}
                          </span>
                          {r.leito && <span className="text-xs text-muted-foreground">Leito {r.leito}</span>}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[r.status] || 'border-border text-muted-foreground'}`}>
                            {r.status}
                          </span>
                        </div>
                        {r.diagnostico && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{r.diagnostico}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70">
                          {format(new Date(r.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(r.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/15 text-muted-foreground/30 hover:text-destructive transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}